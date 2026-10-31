import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink } from "@/components/account-link";
import { XBot } from "@/components/bot/x-bot";
import { MotionEffects, PageEnter } from "@/components/motion/motion-effects";
import { SiteHeader } from "@/components/site-header";
import { aiEnabled } from "@/lib/ai/settings";
import { allowIndexing } from "@/lib/indexing";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Xplaind", template: "%s | Xplaind" },
  description:
    "Role-based AI learning paths for India. A short test finds your level, then you get the next five steps with the best course for each.",
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
        <SiteHeader />
        <div id="page" className="flex-1">
          {children}
        </div>
        <footer className="border-t border-violet-100 bg-gradient-to-r from-violet-50/80 via-pink-50/60 to-teal-50/70 px-4 py-8 text-sm dark:border-violet-950 dark:from-violet-950/40 dark:via-transparent dark:to-teal-950/30">
          <nav aria-label="Footer" className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="underline-offset-2 hover:underline">
              Xplaind
            </Link>
            <Link href="/paths" className="underline-offset-2 hover:underline">
              Roadmaps
            </Link>
            <Link href="/library" className="underline-offset-2 hover:underline">
              Library
            </Link>
            <Link href="/topics" className="underline-offset-2 hover:underline">
              Topics
            </Link>
            <Link href="/resources" className="underline-offset-2 hover:underline">
              Courses
            </Link>
            <Link href="/projects" className="underline-offset-2 hover:underline">
              Projects
            </Link>
            <Link href="/interview" className="underline-offset-2 hover:underline">
              Interview questions
            </Link>
            <Link href="/interview/simulator" className="underline-offset-2 hover:underline">
              Mock interview
            </Link>
            <Link href="/ai" className="underline-offset-2 hover:underline">
              AI tools
            </Link>
            <Link href="/practice" className="underline-offset-2 hover:underline">
              Practice
            </Link>
            <Link href="/certifications" className="underline-offset-2 hover:underline">
              Certifications
            </Link>
            <Link href="/blog" className="underline-offset-2 hover:underline">
              Blog
            </Link>
            <Link href="/glossary" className="underline-offset-2 hover:underline">
              Glossary
            </Link>
            <Link href="/dashboard" className="underline-offset-2 hover:underline">
              Your progress
            </Link>
            <Link href="/how-we-rank" className="underline-offset-2 hover:underline">
              How we rank
            </Link>
            <AccountLink className="underline-offset-2 hover:underline" />
          </nav>
        </footer>
        <MotionEffects />
        {/* These read the URL, so pages with dynamic URLs render them in the browser. */}
        <Suspense fallback={null}>
          <PageEnter />
          <XBot aiOn={aiEnabled()} />
        </Suspense>
      </body>
    </html>
  );
}
