// Shared body parsing for the AI routes. Node only.
import type { z } from "zod";
import { problem, readJson } from "@/lib/account/http";

/** The request body checked against a schema, or a 400 response. */
export async function body<S extends z.ZodType>(request: Request, schema: S, maxBytes = 60_000): Promise<z.infer<S> | Response> {
  const parsed = schema.safeParse(await readJson(request, maxBytes).catch(() => null));
  return parsed.success ? parsed.data : problem(400, "Please check what you entered and try again.");
}
