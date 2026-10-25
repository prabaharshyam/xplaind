import type { Metadata } from "next";
import Link from "next/link";
import { allowIndexing } from "@/lib/indexing";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Xplaind", template: "%s | Xplaind" },
  description:
    "A free-first path to learn AI. A short test finds your level, then you get the next five steps with the best free or low-cost course for each.",
  // Not listed in search results until launch (see src/lib/indexing.ts).
  ...(allowIndexing() ? {} : { robots: { index: false, follow: false } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 px-4 py-6 text-sm dark:border-zinc-800">
          <nav aria-label="Footer" className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="underline-offset-2 hover:underline">
              Xplaind
            </Link>
            <Link href="/roadmap/genai-engineer" className="underline-offset-2 hover:underline">
              Roadmap
            </Link>
            <Link href="/how-we-rank" className="underline-offset-2 hover:underline">
              How we rank
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
