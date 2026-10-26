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
