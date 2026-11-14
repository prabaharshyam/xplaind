import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Db, PERMISSION_DENIED, asUser, freshDatabase } from "./db";

// SC-2: a test signs in as user A and must fail to read or change user B's rows.
// AC-4: progress rows are readable and writable only by their owner.
const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

let db: Db;
const q = (sql: string, params: unknown[] = []) => db.client.query(sql, params);
const fails = async (p: Promise<unknown>) => {
  const err = await p.then(() => null, (e: { code?: string }) => e);
  expect(err, "expected the statement to be refused").not.toBeNull();
  return err as { code?: string };
};

beforeAll(async () => {
  db = await freshDatabase();
  // Seed as the owner (superuser bypasses RLS), the way the service role would.
  await q("insert into auth.users (id, email) values ($1, 'a@example.com'), ($2, 'b@example.com')", [A, B]);
  for (const id of [A, B]) {
    await q("insert into profiles (id, weekly_hours, adult_confirmed_at) values ($1, 5, now())", [id]);
    await q("insert into stop_progress (user_id, stop_id, status) values ($1, 'what-is-ai', 'in_progress')", [id]);
    await q("insert into practice_ratings (user_id, question_id, rating) values ($1, 'what-is-rag', 1)", [id]);
    await q("insert into quiz_attempts (user_id, goal_id, quiz_version, answers, start_level) values ($1, 'genai-engineer', 'v1', '[]', 'B1')", [id]);
    await q("insert into activity_days (user_id, day) values ($1, '2026-10-20')", [id]);
    await q("insert into badges (user_id, badge_id) values ($1, 'level-B1')", [id]);
    await q("insert into level_cards (user_id, level, goal_id, weeks_active) values ($1, 'B2', 'genai-engineer', 3)", [id]);
    await q("insert into ai_usage (user_id, day, kind) values ($1, '2026-10-20', 'grade')", [id]);
  }
  await q("insert into email_subscriptions (email, user_id, source, consent_text, consent_at) values ('a@example.com', $1, 'landing', 'Yes, email me', now())", [A]);
  await q("insert into resource_clicks (resource_id, stop_id, level) values ('cs50p', 'python-basics', 'B2')");
  await q("insert into roadmap_downloads (path_id, name, email, experience, consent_text, user_id) values ('genai-engineer', 'Asha', 'a@example.com', 'fresher', 'Yes', $1)", [A]);
  for (const [id, email] of [[A, "a@example.com"], [B, "b@example.com"]]) {
    await q("insert into commitments (user_id, path_id, email, consent_text) values ($1, 'ai-engineer', $2, 'Yes, email me weekly')", [id, email]);
  }
}, 60_000);

afterAll(async () => {
  await db?.drop();
});

const OWNED = ["profiles", "quiz_attempts", "stop_progress", "activity_days", "badges", "practice_ratings", "level_cards", "ai_usage"];
const ownerColumn = (t: string) => (t === "profiles" ? "id" : "user_id");

describe("row-level security (SC-2, AC-4)", () => {
  for (const table of OWNED) {
    it(`${table}: user A sees only their own rows`, async () => {
      const rows = await asUser(db.client, A, async () => (await q(`select ${ownerColumn(table)} as owner from ${table}`)).rows);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.owner === A)).toBe(true);
    });
  }

  it("a signed-out visitor sees nothing and can write nothing", async () => {
    for (const table of [...OWNED, "email_subscriptions", "resource_clicks", "rate_limits", "roadmap_downloads"]) {
      const err = await fails(asUser(db.client, null, () => q(`select * from ${table}`)));
      expect(err.code, table).toBe(PERMISSION_DENIED);
    }
  });

  it("user A cannot change or delete user B's progress", async () => {
    const updated = await asUser(db.client, A, () => q("update stop_progress set status = 'done' where user_id = $1", [B]));
    expect(updated.rowCount).toBe(0);
    const deleted = await asUser(db.client, A, () => q("delete from stop_progress where user_id = $1", [B]));
    expect(deleted.rowCount).toBe(0);
    expect((await q("select status from stop_progress where user_id = $1", [B])).rows[0].status).toBe("in_progress");
  });

  it("user A cannot write a row in user B's name", async () => {
    await fails(asUser(db.client, A, () => q("insert into stop_progress (user_id, stop_id, status) values ($1, 'x', 'done')", [B])));
    await fails(asUser(db.client, A, () => q("insert into practice_ratings (user_id, question_id, rating) values ($1, 'x', 2)", [B])));
    await fails(asUser(db.client, A, () => q("update practice_ratings set user_id = $1 where user_id = $2", [B, A])));
  });

  it("user A can write their own progress and ratings", async () => {
    await asUser(db.client, A, async () => {
      await q("insert into stop_progress (user_id, stop_id, status, done_how) values ($1, 'python-basics', 'done', 'self_skipped')", [A]);
      await q("update practice_ratings set rating = 2 where user_id = $1", [A]);
      expect((await q("select count(*)::int as n from stop_progress")).rows[0].n).toBe(2);
    });
  });

  it("accepts a one-tap done as self_marked and rejects unknown done_how values (RM-7)", async () => {
    await asUser(db.client, A, () => q("insert into stop_progress (user_id, stop_id, status, done_how) values ($1, 'llm-apis', 'done', 'self_marked')", [A]));
    await fails(asUser(db.client, A, () => q("insert into stop_progress (user_id, stop_id, status, done_how) values ($1, 'rag-app', 'done', 'guessed')", [A])));
  });

  it("learners cannot write rows only the server may write", async () => {
    for (const [table, sql] of [
      ["quiz_attempts", "insert into quiz_attempts (user_id, goal_id, quiz_version, answers, start_level) values ($1, 'g', 'v1', '[]', 'P3')"],
      ["badges", "insert into badges (user_id, badge_id) values ($1, 'level-P3')"],
      ["activity_days", "insert into activity_days (user_id, day) values ($1, '2026-10-21')"],
      ["level_cards", "insert into level_cards (user_id, level, goal_id, weeks_active) values ($1, 'P3', 'g', 99)"],
      ["profiles", "insert into profiles (id, adult_confirmed_at) values ($1, now())"],
    ] as const) {
      const err = await fails(asUser(db.client, A, () => q(sql, [A])));
      expect(err.code, table).toBe(PERMISSION_DENIED);
    }
  });

  it("a learner can change weekly hours, but not the 18+ timestamp or start level", async () => {
    await asUser(db.client, A, async () => {
      const ok = await q("update profiles set weekly_hours = 10 where id = $1", [A]);
      expect(ok.rowCount).toBe(1);
    });
    await fails(asUser(db.client, A, () => q("update profiles set adult_confirmed_at = now() where id = $1", [A])));
    await fails(asUser(db.client, A, () => q("update profiles set start_level = 'P3' where id = $1", [A])));
  });

  it("a learner can set their own last lesson (AC-6), but not another learner's", async () => {
    await asUser(db.client, A, async () => {
      expect((await q("update profiles set last_stop_id = 'what-is-ai', last_stop_at = now() where id = $1", [A])).rowCount).toBe(1);
      expect((await q("update profiles set last_stop_id = 'what-is-ai' where id = $1", [B])).rowCount).toBe(0);
    });
  });

  it("server-only tables are closed to learners", async () => {
    for (const table of ["email_subscriptions", "resource_clicks", "rate_limits", "roadmap_downloads"]) {
      const err = await fails(asUser(db.client, A, () => q(`select * from ${table}`)));
      expect(err.code, table).toBe(PERMISSION_DENIED);
    }
    await fails(asUser(db.client, A, () => q("select public.hit_rate_limit('x', 60, 5)")));
  });

  it("a learner can delete their own level card but not someone else's", async () => {
    await asUser(db.client, A, async () => {
      expect((await q("delete from level_cards where user_id = $1", [B])).rowCount).toBe(0);
      expect((await q("delete from level_cards where user_id = $1", [A])).rowCount).toBe(1);
    });
  });
});

describe("constraints", () => {
  it("rejects a check score above 100 and a project link that is not a web address", async () => {
    await fails(q("insert into stop_progress (user_id, stop_id, status, done_how, check_score) values ($1, 'c1', 'done', 'check', 101)", [A]));
    await fails(q("insert into stop_progress (user_id, stop_id, status, done_how, project_url) values ($1, 'c2', 'done', 'project', 'javascript:alert(1)')", [A]));
    await fails(q("insert into stop_progress (user_id, stop_id, status, done_how) values ($1, 'c3', 'in_progress', 'check')", [A]));
  });
});

describe("roadmap downloads (RD-2)", () => {
  it("visitors and learners cannot write a download row, even their own", async () => {
    const row = "('genai-engineer', 'X', 'x@example.com', 'student', 'Yes')";
    await fails(asUser(db.client, null, () => q(`insert into roadmap_downloads (path_id, name, email, experience, consent_text) values ${row}`)));
    await fails(asUser(db.client, A, () => q(`insert into roadmap_downloads (path_id, name, email, experience, consent_text) values ${row}`)));
  });

  it("rejects a bad email, a bad phone and an unknown experience band", async () => {
    const ins = (email: string, phone: string | null, exp: string) =>
      q("insert into roadmap_downloads (path_id, name, email, phone, experience, consent_text) values ('p', 'N', $1, $2, $3, 'Yes')", [email, phone, exp]);
    await fails(ins("not-an-email", null, "student"));
    await fails(ins("n@example.com", "12ab", "student"));
    await fails(ins("n@example.com", null, "wizard"));
    await ins("n@example.com", "+919876543210", "1-3");
  });
});

describe("rate limits (SC-3)", () => {
  it("allows up to the limit in a window, then refuses", async () => {
    const hits: boolean[] = [];
    for (let i = 0; i < 4; i++) hits.push((await q("select public.hit_rate_limit('test:ip', 60, 3) as ok")).rows[0].ok);
    expect(hits).toEqual([true, true, true, false]);
  });
});

describe("AI spend guard (CO-1)", () => {
  const reserve = async (user: string, kind: string, day: string, dailyMax: number, cap: number) =>
    (await q("select public.ai_reserve($1, $2, $3, '2026-10-01', $4, $5) as r", [user, kind, day, dailyMax, cap])).rows[0].r;

  it("counts calls and refuses at the learner's daily cap for that kind", async () => {
    const got: string[] = [];
    for (let i = 0; i < 3; i++) got.push(await reserve(A, "roadmap", "2026-10-26", 2, 20));
    expect(got).toEqual(["ok", "ok", "day"]);
    expect(await reserve(A, "tutor", "2026-10-26", 2, 20)).toBe("ok");
    expect(await reserve(A, "roadmap", "2026-10-27", 2, 20)).toBe("ok");
  });

  it("records tokens and cost, and refuses everyone once the month's spend reaches the cap", async () => {
    await q("select public.ai_record($1, 'roadmap', '2026-10-26', 1200, 3400, 19.5)", [A]);
    const row = (await q("select tokens_in, tokens_out, cost_usd::float as cost from ai_usage where user_id = $1 and kind = 'roadmap' and day = '2026-10-26'", [A])).rows[0];
    expect(row).toEqual({ tokens_in: 1200, tokens_out: 3400, cost: 19.5 });
    expect(await reserve(B, "coach", "2026-10-26", 5, 20)).toBe("ok");
    await q("select public.ai_record($1, 'coach', '2026-10-26', 10, 10, 0.5)", [B]);
    expect(await reserve(B, "coach", "2026-10-26", 5, 20)).toBe("month");
    expect(await reserve(A, "tutor", "2026-10-26", 5, 20)).toBe("month");
    expect(await reserve(A, "tutor", "2026-10-26", 5, 25)).toBe("ok");
  });

  it("learners cannot call the guard functions or write usage", async () => {
    for (const sql of [
      "select public.ai_reserve($1, 'x', '2026-10-26', '2026-10-01', 99, 999)",
      "select public.ai_record($1, 'x', '2026-10-26', 0, 0, -100)",
      "insert into ai_usage (user_id, day, kind) values ($1, '2026-10-28', 'x')",
      "update ai_usage set cost_usd = 0 where user_id = $1",
    ]) {
      const err = await fails(asUser(db.client, A, () => q(sql, [A])));
      expect(err.code, sql).toBe(PERMISSION_DENIED);
    }
  });
});

describe("AI for guests without an account (SU-5)", () => {
  const guest = async (visitor: string, kind: string, day: string, dailyMax: number, cap: number) =>
    (await q("select public.ai_reserve_guest($1, $2, $3, '2026-11-01', $4, $5) as r", [visitor, kind, day, dailyMax, cap])).rows[0].r;
  const learner = async (user: string, cap: number) =>
    (await q("select public.ai_reserve($1, 'tutor', '2026-11-03', '2026-11-01', 99, $2) as r", [user, cap])).rows[0].r;

  it("counts each visitor's calls per kind and day", async () => {
    const got: string[] = [];
    for (let i = 0; i < 3; i++) got.push(await guest("hash-1", "coach", "2026-11-02", 2, 20));
    expect(got).toEqual(["ok", "ok", "day"]);
    expect(await guest("hash-2", "coach", "2026-11-02", 2, 20)).toBe("ok");
    expect(await guest("hash-1", "coach", "2026-11-03", 2, 20)).toBe("ok");
  });

  it("puts guest spend and learner spend under the one monthly cap", async () => {
    await q("select public.ai_record_guest('hash-1', 'coach', '2026-11-02', 500, 900, 4)");
    const row = (await q("select tokens_in, tokens_out, cost_usd::float as cost from ai_guest_usage where visitor = 'hash-1' and kind = 'coach' and day = '2026-11-02'")).rows[0];
    expect(row).toEqual({ tokens_in: 500, tokens_out: 900, cost: 4 });
    expect(await learner(A, 4)).toBe("month");
    expect(await learner(A, 10)).toBe("ok");
    await q("select public.ai_record($1, 'tutor', '2026-11-03', 10, 10, 6)", [A]);
    expect(await guest("hash-3", "coach", "2026-11-03", 5, 10)).toBe("month");
  });

  it("visitors and learners cannot read or write guest usage, or call the guard", async () => {
    for (const who of [A, null]) {
      const rows = await asUser(db.client, who, () => q("select * from ai_guest_usage").then((r) => r.rows, () => []));
      expect(rows).toEqual([]);
      for (const sql of [
        "insert into ai_guest_usage (visitor, day, kind) values ('x', '2026-11-05', 'x')",
        "update ai_guest_usage set cost_usd = 0",
        "select public.ai_reserve_guest('x', 'x', '2026-11-05', '2026-11-01', 99, 999)",
        "select public.ai_reserve_guest_sample('x', 'x', '2026-11-05', '2026-11-01', 99, 999)",
        "select public.ai_record_guest('x', 'x', '2026-11-05', 0, 0, -100)",
        "select public.ai_month_spend('2026-11-01')",
      ]) {
        const err = await fails(asUser(db.client, who, () => q(sql)));
        expect(err.code, sql).toBe(PERMISSION_DENIED);
      }
    }
  });
});

describe("one free AI try for guests once sign-ups are open (AG-1)", () => {
  const sample = async (visitor: string, kind: string, day: string) =>
    (await q("select public.ai_reserve_guest_sample($1, $2, $3, '2026-11-01', 1, 1000) as r", [visitor, kind, day])).rows[0].r;

  it("allows one call a day in total across every AI tool, then asks to sign in", async () => {
    expect(await sample("hash-s1", "tutor", "2026-11-09")).toBe("ok");
    expect(await sample("hash-s1", "resume", "2026-11-09")).toBe("signin");
    expect(await sample("hash-s1", "tutor", "2026-11-09")).toBe("signin");
    expect(await sample("hash-s2", "resume", "2026-11-09")).toBe("ok");
    expect(await sample("hash-s1", "tutor", "2026-11-10")).toBe("ok");
  });

  it("still stops at the monthly cap", async () => {
    const r = (await q("select public.ai_reserve_guest_sample('hash-s3', 'tutor', '2026-11-09', '2026-11-01', 1, 0) as r")).rows[0].r;
    expect(r).toBe("month");
  });
});

describe("account deletion (AC-11)", () => {
  it("removes every row of the learner and only theirs", async () => {
    await q("delete from auth.users where id = $1", [B]);
    for (const table of OWNED) {
      const left = (await q(`select count(*)::int as n from ${table} where ${ownerColumn(table)} = $1`, [B])).rows[0].n;
      expect(left, table).toBe(0);
      const kept = (await q(`select count(*)::int as n from ${table} where ${ownerColumn(table)} = $1`, [A])).rows[0].n;
      expect(kept, table).toBeGreaterThan(0);
    }
  });
});

describe("90-day commitment emails (CM-90)", () => {
  it("a learner reads only their own commitment, and not its unsubscribe token or email", async () => {
    const rows = await asUser(db.client, A, async () => (await q("select user_id, path_id, last_sent_week from commitments")).rows);
    expect(rows).toEqual([{ user_id: A, path_id: "ai-engineer", last_sent_week: 0 }]);
    await fails(asUser(db.client, A, () => q("select unsubscribe_token from commitments")));
    await fails(asUser(db.client, A, () => q("select email from commitments")));
  });

  it("only the server writes commitments", async () => {
    await fails(asUser(db.client, A, () => q("insert into commitments (user_id, path_id, email, consent_text) values ($1, 'x', 'a@example.com', 'y')", [A])));
    const updated = await asUser(db.client, A, () => q("update commitments set last_sent_week = 13 where user_id = $1", [A]).then((r) => r.rowCount, () => -1));
    expect(updated === 0 || updated === -1).toBe(true);
    expect((await q("select last_sent_week from commitments where user_id = $1", [A])).rows[0].last_sent_week).toBe(0);
    const err = await fails(asUser(db.client, null, () => q("select * from commitments")));
    expect(err.code).toBe(PERMISSION_DENIED);
  });

  it("is removed with the account", async () => {
    await q("insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000cc', 'c@example.com')");
    await q("insert into commitments (user_id, path_id, email, consent_text) values ('00000000-0000-4000-8000-0000000000cc', 'p', 'c@example.com', 'Yes')");
    await q("delete from auth.users where id = '00000000-0000-4000-8000-0000000000cc'");
    expect((await q("select count(*)::int as n from commitments where email = 'c@example.com'")).rows[0].n).toBe(0);
  });
});

describe("Pro passes (PAY-2)", () => {
  const C = "00000000-0000-4000-8000-0000000000c1";
  const D = "00000000-0000-4000-8000-0000000000d1";
  const order = (id: string, user: string, plan = "pass_month", paise = 24900) =>
    q("insert into payments (order_id, user_id, plan_id, amount_paise, environment) values ($1, $2, $3, $4, 'sandbox')", [id, user, plan, paise]);

  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'c@example.com'), ($2, 'd@example.com')", [C, D]);
    await order("xp_c_000001", C);
    await order("xp_d_000001", D, "pass_year", 199900);
  });

  it("a learner reads only their own payments and pass, and a visitor reads neither", async () => {
    await q("select public.grant_pass('xp_d_000001', 'cf1', '2026-11-08T10:00:00+05:30')");
    const pays = await asUser(db.client, C, async () => (await q("select order_id from payments")).rows);
    expect(pays).toEqual([{ order_id: "xp_c_000001" }]);
    const passes = await asUser(db.client, C, async () => (await q("select user_id from entitlements")).rows);
    expect(passes).toEqual([]);
    for (const table of ["payments", "entitlements"]) {
      const err = await fails(asUser(db.client, null, () => q(`select * from ${table}`)));
      expect(err.code, table).toBe(PERMISSION_DENIED);
    }
  });

  it("only the server writes payments and passes, or grants a pass", async () => {
    for (const sql of [
      `insert into payments (order_id, user_id, plan_id, amount_paise, environment) values ('xp_c_hack01', '${C}', 'pass_year', 1, 'sandbox')`,
      `insert into entitlements (user_id, plan_id, valid_until) values ('${C}', 'pass_year', '2099-01-01')`,
      "select public.grant_pass('xp_c_000001', 'x', now())",
    ]) {
      const err = await fails(asUser(db.client, C, () => q(sql)));
      expect(err.code, sql).toBe(PERMISSION_DENIED);
    }
    const updated = await asUser(db.client, C, () => q("update payments set status = 'paid'").then((r) => r.rowCount, () => -1));
    expect(updated === 0 || updated === -1).toBe(true);
    expect((await q("select status from payments where order_id = 'xp_c_000001'")).rows[0].status).toBe("created");
  });

  it("grants a pass once per order, and a second pass starts when the first ends", async () => {
    const grant = async (id: string) => (await q("select public.grant_pass($1, 'cf', '2026-11-08T10:00:00+05:30') as r", [id])).rows[0].r;
    expect(await grant("xp_c_000001")).toBe("granted");
    expect(await grant("xp_c_000001")).toBe("already");
    expect(await grant("xp_nope_0001")).toBe("missing");
    const until = async () => (await q("select valid_until from entitlements where user_id = $1", [C])).rows[0].valid_until as Date;
    expect((await until()).toISOString()).toBe("2026-12-08T04:30:00.000Z");
    await order("xp_c_000002", C, "pass_6month", 119900);
    expect(await grant("xp_c_000002")).toBe("granted");
    expect((await until()).toISOString()).toBe("2027-06-08T04:30:00.000Z");
    expect((await q("select status, paid_at is not null as paid from payments where order_id = 'xp_c_000002'")).rows[0]).toEqual({ status: "paid", paid: true });
  });

  it("keeps the payment record but not the pass when the account is deleted", async () => {
    await q("delete from auth.users where id = $1", [D]);
    expect((await q("select count(*)::int as n from entitlements where user_id = $1", [D])).rows[0].n).toBe(0);
    expect((await q("select user_id, status from payments where order_id = 'xp_d_000001'")).rows[0]).toEqual({ user_id: null, status: "paid" });
  });
});

describe("Promo codes (PAY-9)", () => {
  const E = "00000000-0000-4000-8000-0000000000e1";
  const F = "00000000-0000-4000-8000-0000000000f1";
  const order = (id: string, user: string, paise: number, code: string | null, pct: number) =>
    q("insert into payments (order_id, user_id, plan_id, amount_paise, environment, promo_code, discount_percent) values ($1, $2, 'pass_month', $3, 'sandbox', $4, $5)", [id, user, paise, code, pct]);
  const grant = async (id: string) => (await q("select public.grant_pass($1, null, '2026-11-13T10:00:00+05:30') as r", [id])).rows[0].r;

  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'e@example.com'), ($2, 'f@example.com')", [E, F]);
    await q("insert into promo_codes (code, percent_off) values ('testfree', 100), ('testhalf', 50)");
  });

  it("stores codes in lower case only, and no learner or visitor can read or add codes", async () => {
    expect((await fails(q("insert into promo_codes (code, percent_off) values ('UPPER', 10)"))).code).toBe("23514");
    expect((await fails(q("insert into promo_codes (code, percent_off) values ('zeroff', 0)"))).code).toBe("23514");
    for (const user of [E, null]) {
      for (const sql of ["select * from promo_codes", "insert into promo_codes (code, percent_off) values ('mine', 100)"]) {
        const err = await fails(asUser(db.client, user, () => q(sql)));
        expect(err.code, sql).toBe(PERMISSION_DENIED);
      }
    }
  });

  it("a free order grants the pass and uses the code; a second free order with it grants nothing", async () => {
    await order("xp_e_free01", E, 0, "testfree", 100);
    expect(await grant("xp_e_free01")).toBe("granted");
    expect((await q("select code, order_id from promo_redemptions where user_id = $1", [E])).rows).toEqual([{ code: "testfree", order_id: "xp_e_free01" }]);
    await order("xp_e_free02", E, 0, "testfree", 100);
    expect(await grant("xp_e_free02")).toBe("used");
    expect((await q("select status from payments where order_id = 'xp_e_free02'")).rows[0].status).toBe("failed");
    expect((await q("select valid_until from entitlements where user_id = $1", [E])).rows[0].valid_until.toISOString()).toBe("2026-12-13T04:30:00.000Z");
  });

  it("an abandoned order does not use the code; another account can use the same code", async () => {
    await order("xp_f_half01", F, 12450, "testhalf", 50);
    expect((await q("select count(*)::int as n from promo_redemptions where user_id = $1", [F])).rows[0].n).toBe(0);
    await order("xp_f_free01", F, 0, "testfree", 100);
    expect(await grant("xp_f_free01")).toBe("granted");
  });

  it("a learner reads only their own redemptions and cannot write any", async () => {
    const mine = await asUser(db.client, E, async () => (await q("select code from promo_redemptions")).rows);
    expect(mine).toEqual([{ code: "testfree" }]);
    const err = await fails(asUser(db.client, E, () => q(`insert into promo_redemptions (user_id, code, order_id) values ('${E}', 'testhalf', 'xp_f_half01')`)));
    expect(err.code).toBe(PERMISSION_DENIED);
    expect((await fails(asUser(db.client, null, () => q("select * from promo_redemptions")))).code).toBe(PERMISSION_DENIED);
  });

  it("removes redemptions with the account", async () => {
    await q("delete from auth.users where id = $1", [F]);
    expect((await q("select count(*)::int as n from promo_redemptions where user_id = $1", [F])).rows[0].n).toBe(0);
  });
});

describe("Week pass, referrals and funnel counts (PAY-11, RF-1, AN-1)", () => {
  const G = "00000000-0000-4000-8000-0000000000a7";
  const H = "00000000-0000-4000-8000-0000000000b7";
  const order = (id: string, user: string, plan: string, paise: number, referrer: string | null = null, pct = 0) =>
    q("insert into payments (order_id, user_id, plan_id, amount_paise, environment, referrer, discount_percent) values ($1, $2, $3, $4, 'sandbox', $5, $6)", [id, user, plan, paise, referrer, pct]);
  const grant = async (id: string) => (await q("select public.grant_pass($1, 'pay', '2026-11-14T10:00:00+05:30') as r", [id])).rows[0].r;
  const until = async (user: string) => (await q("select valid_until from entitlements where user_id = $1", [user])).rows[0]?.valid_until as Date | undefined;

  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'g@example.com'), ($2, 'h@example.com')", [G, H]);
    await q("insert into referral_codes (user_id, code) values ($1, 'gggg2345')", [G]);
  });

  it("a week pass lasts 7 days", async () => {
    await order("xp_g_week01", G, "pass_week", 9900);
    expect(await grant("xp_g_week01")).toBe("granted");
    expect((await until(G))!.toISOString()).toBe("2026-11-21T04:30:00.000Z");
  });

  it("a friend's first paid pass gives the referrer 7 more days, once, and is counted as a purchase", async () => {
    await order("xp_h_ref001", H, "pass_month", 22410, G, 10);
    expect(await grant("xp_h_ref001")).toBe("granted");
    expect((await until(G))!.toISOString()).toBe("2026-11-28T04:30:00.000Z");
    expect((await q("select referrer, order_id from referrals where referred_user = $1", [H])).rows).toEqual([{ referrer: G, order_id: "xp_h_ref001" }]);
    await order("xp_h_ref002", H, "pass_month", 24900, G, 0);
    expect(await grant("xp_h_ref002")).toBe("granted");
    expect((await until(G))!.toISOString()).toBe("2026-11-28T04:30:00.000Z");
    expect((await q("select count from funnel_daily where day = '2026-11-14' and event = 'purchase'")).rows[0].count).toBeGreaterThanOrEqual(3);
  });

  it("a learner reads only their own code and rewards; nobody reads the funnel or writes any of it", async () => {
    expect(await asUser(db.client, G, async () => (await q("select code from referral_codes")).rows)).toEqual([{ code: "gggg2345" }]);
    expect(await asUser(db.client, H, async () => (await q("select code from referral_codes")).rows)).toEqual([]);
    expect(await asUser(db.client, G, async () => (await q("select referred_user from referrals")).rows)).toEqual([{ referred_user: H }]);
    for (const user of [G, null]) {
      for (const sql of [
        "select * from funnel_daily",
        "select public.funnel_bump('purchase')",
        `insert into referral_codes (user_id, code) values ('${H}', 'hhhh2345')`,
        `insert into referrals (referred_user, referrer, order_id) values ('${H}', '${G}', 'xp_h_ref001')`,
      ]) {
        const err = await fails(asUser(db.client, user, () => q(sql)));
        expect(err.code, sql).toBe(PERMISSION_DENIED);
      }
    }
  });

  it("funnel events outside the list are refused", async () => {
    expect((await fails(q("select public.funnel_bump('who_clicked')"))).code).toBe("23514");
  });
});

describe("Interview readiness (IR-1)", () => {
  const J = "00000000-0000-4000-8000-0000000000c9";
  const K = "00000000-0000-4000-8000-0000000000d9";
  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'j@example.com'), ($2, 'k@example.com')", [J, K]);
    await q("insert into interview_readiness (user_id, path_id, score, answered) values ($1, 'ai-engineer', 60, 5), ($2, 'ai-engineer', 80, 5)", [J, K]);
  });

  it("a learner reads only their own scores, and only the server writes them", async () => {
    expect(await asUser(db.client, J, async () => (await q("select score from interview_readiness")).rows)).toEqual([{ score: 60 }]);
    for (const user of [J, null]) {
      const err = await fails(asUser(db.client, user, () => q(`insert into interview_readiness (user_id, path_id, score, answered) values ('${J}', 'ai-engineer', 100, 5)`)));
      expect(err.code).toBe(PERMISSION_DENIED);
    }
    expect((await fails(asUser(db.client, null, () => q("select * from interview_readiness")))).code).toBe(PERMISSION_DENIED);
  });

  it("refuses scores out of range and goes with the account", async () => {
    expect((await fails(q("insert into interview_readiness (user_id, path_id, score, answered) values ($1, 'x', 101, 5)", [J]))).code).toBe("23514");
    await q("delete from auth.users where id = $1", [K]);
    expect((await q("select count(*)::int as n from interview_readiness where user_id = $1", [K])).rows[0].n).toBe(0);
  });
});

describe("Project reviews (PR-1)", () => {
  const L = "00000000-0000-4000-8000-0000000000e9";
  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'l@example.com')", [L]);
    await q("insert into project_reviews (user_id, project_id, score, passed, repo_url) values ($1, 'rag-bot', 82, true, 'https://github.com/l/rag-bot')", [L]);
  });

  it("a learner reads only their own reviews; nobody but the server writes them", async () => {
    expect(await asUser(db.client, L, async () => (await q("select project_id, passed from project_reviews")).rows)).toEqual([{ project_id: "rag-bot", passed: true }]);
    expect(await asUser(db.client, "00000000-0000-4000-8000-0000000000c1", async () => (await q("select * from project_reviews")).rows)).toEqual([]);
    const err = await fails(asUser(db.client, L, () => q(`insert into project_reviews (user_id, project_id, score, passed) values ('${L}', 'rag-bot', 100, true)`)));
    expect(err.code).toBe(PERMISSION_DENIED);
  });

  it("refuses links that are not https", async () => {
    expect((await fails(q("insert into project_reviews (user_id, project_id, score, passed, repo_url) values ($1, 'x1', 50, false, 'javascript:alert(1)')", [L]))).code).toBe("23514");
  });
});


describe("Public profiles and certificates (PF-1, CT-1)", () => {
  const M = "00000000-0000-4000-8000-0000000000f1";
  const N = "00000000-0000-4000-8000-0000000000f2";
  beforeAll(async () => {
    await q("insert into auth.users (id, email) values ($1, 'm@example.com'), ($2, 'n@example.com')", [M, N]);
    await q("insert into public_profiles (user_id, handle, display_name) values ($1, 'm-learner', 'Meera')", [M]);
    await q("insert into certificates (id, user_id, path_id, name_on_certificate) values ('abcdefghjk', $1, 'ai-engineer', 'Meera')", [M]);
  });

  it("a profile is off until the learner turns it on", async () => {
    expect((await q("select enabled from public_profiles where user_id = $1", [M])).rows[0].enabled).toBe(false);
  });

  it("a learner reads only their own profile and certificates; nobody but the server writes them", async () => {
    expect(await asUser(db.client, M, async () => (await q("select handle from public_profiles")).rows)).toEqual([{ handle: "m-learner" }]);
    expect(await asUser(db.client, N, async () => (await q("select * from public_profiles")).rows)).toEqual([]);
    expect(await asUser(db.client, N, async () => (await q("select * from certificates")).rows)).toEqual([]);
    expect((await fails(asUser(db.client, M, () => q(`update public_profiles set enabled = true where user_id = '${M}'`)))).code).toBe(PERMISSION_DENIED);
    expect((await fails(asUser(db.client, M, () => q(`insert into certificates (id, user_id, path_id, name_on_certificate) values ('zzzzzzzzzz', '${M}', 'x', 'Meera')`)))).code).toBe(PERMISSION_DENIED);
  });

  it("one certificate per role, unique handles, and both go with the account", async () => {
    expect((await fails(q("insert into certificates (id, user_id, path_id, name_on_certificate) values ('bcdefghjkm', $1, 'ai-engineer', 'Meera')", [M]))).code).toBe("23505");
    expect((await fails(q("insert into public_profiles (user_id, handle, display_name) values ($1, 'm-learner', 'Neel')", [N]))).code).toBe("23505");
    await q("delete from auth.users where id = $1", [M]);
    expect((await q("select count(*)::int as n from certificates where user_id = $1", [M])).rows[0].n).toBe(0);
    expect((await q("select count(*)::int as n from public_profiles where user_id = $1", [M])).rows[0].n).toBe(0);
  });
});
