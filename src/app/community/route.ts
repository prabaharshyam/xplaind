// CM-2: the Community page was removed (owner, 2026-11-02). Every "Join" button goes straight to
// the WhatsApp group, and old /community links land there too. The link stays in content/.
import { getCommunity } from "@/lib/content/community";

export function GET(request: Request): Response {
  const url = getCommunity().whatsapp_url;
  return Response.redirect(url || new URL("/", request.url).toString(), 307);
}
