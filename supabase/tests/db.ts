// A throwaway database per test run: the Supabase shim, then every migration in order.
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const ADMIN_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:54329/postgres";

export type Db = { client: Client; drop: () => Promise<void> };

export async function freshDatabase(): Promise<Db> {
  const name = `xplaind_test_${process.pid}_${Date.now()}`;
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  const dir = path.join(__dirname, "..");
  await client.query(fs.readFileSync(path.join(dir, "tests", "auth-shim.sql"), "utf8"));
  for (const file of fs.readdirSync(path.join(dir, "migrations")).sort()) {
    await client.query(fs.readFileSync(path.join(dir, "migrations", file), "utf8"));
  }
  return {
    client,
    drop: async () => {
      await client.end();
      await admin.query(`drop database ${name}`);
      await admin.end();
    },
  };
}

/** Runs fn as a signed-in learner (role authenticated, JWT sub = userId), then rolls back. */
export async function asUser<T>(client: Client, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    await client.query(`set local role ${userId ? "authenticated" : "anon"}`);
    if (userId) await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    return await fn();
  } finally {
    await client.query("rollback");
  }
}

/** Postgres error code for "permission denied", raised by missing grants. */
export const PERMISSION_DENIED = "42501";
