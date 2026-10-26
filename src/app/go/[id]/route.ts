// RM-5: log the click, then redirect. A plain link, so it works with JavaScript off.
import { after, type NextRequest } from "next/server";
import { getResource, getStop } from "@/lib/content";
import { resolveGo } from "@/lib/go";

export async function GET(request: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const go = resolveGo(id, request.nextUrl.searchParams.get("stop"), { resource: getResource, stop: getStop });
  // SC-4: an unknown id is a 404, never a redirect.
  if (!go.found) return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });

  // Slice S5 writes this to the resource_clicks table. Until then it goes to the
  // host's request log. Only the fields in `click`; nothing about the visitor.
  after(() => console.info(JSON.stringify({ event: "resource_click", ...go.click })));

  return new Response(null, {
    status: 302,
    headers: { Location: go.url, "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "origin" },
  });
}
