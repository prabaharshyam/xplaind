// APP-0: a stand-in for Supabase during the signed-in browser tests. The accounts-on test build points at
// http://localhost:54321, so both the browser and the Next server talk to this, never to a real project.
// It knows one learner, answers every table read with no rows, and accepts every write.
import { createServer } from "node:http";

import { USER } from "./learner.mjs";

const port = Number(process.env.MOCK_SUPABASE_PORT || 54321);
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
  "access-control-expose-headers": "content-range",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...cors, ...headers });
    res.end(body === undefined ? "" : JSON.stringify(body));
  };
  if (req.method === "OPTIONS") return send(204);
  const p = url.pathname;
  const signed = /^Bearer\s+\S+\.\S+\.\S+/.test(req.headers.authorization ?? "");
  if (p === "/auth/v1/user") return signed ? send(200, USER) : send(401, { code: 401, msg: "no session" });
  if (p.startsWith("/auth/v1/.well-known/jwks.json")) return send(200, { keys: [] });
  if (p === "/auth/v1/logout") return send(204);
  if (p.startsWith("/auth/v1/")) return send(200, {});
  if (p.startsWith("/rest/v1/rpc/")) return send(200, null);
  if (p.startsWith("/rest/v1/")) {
    if (req.method === "HEAD") return send(200, undefined, { "content-range": "*/0" });
    if (req.method === "GET") {
      if ((req.headers.accept ?? "").includes("vnd.pgrst.object")) return send(406, { code: "PGRST116", message: "no rows", details: "", hint: null });
      return send(200, [], { "content-range": "*/0" });
    }
    return send(201, []);
  }
  if (p === "/health") return send(200, { ok: true });
  return send(404, {});
}).listen(port, () => console.log(`mock supabase on ${port}`));
