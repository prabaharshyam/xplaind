// BK-2: where a book link goes. Pure. The tag comes from the AMAZON_IN_TAG setting,
// never from the request, and only for Amazon India links.
import type { Book } from "@/lib/content/schema";

/** The Associates tracking id looks like "name-21". Anything else is ignored. */
const TAG = /^[a-z0-9][a-z0-9-]{1,40}-21$/i;

export function amazonLink(url: string, tag: string | undefined): string {
  const u = new URL(url);
  if (u.hostname !== "www.amazon.in" || !tag || !TAG.test(tag)) return url;
  u.searchParams.set("tag", tag);
  return u.toString();
}

export const bookHref = (b: Pick<Book, "id">) => `/go/book/${b.id}`;
