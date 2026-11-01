// BK-2: send a reader to the book on Amazon India with the affiliate tag. A plain link,
// so it works with JavaScript off. Logs only the book id, nothing about the visitor.
import { after, type NextRequest } from "next/server";
import { getContent } from "@/lib/content";
import { amazonLink } from "@/lib/books";

export async function GET(_request: NextRequest, ctx: RouteContext<"/go/book/[id]">) {
  const { id } = await ctx.params;
  const book = getContent().books.find((b) => b.data.id === id)?.data;
  // SC-4: an unknown id is a 404, never a redirect.
  if (!book) return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  after(() => console.info(JSON.stringify({ event: "book_click", book_id: book.id, affiliate: true })));
  return new Response(null, {
    status: 302,
    headers: {
      Location: amazonLink(book.amazon_in_url, process.env.AMAZON_IN_TAG),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "origin",
    },
  });
}
