import type { Metadata } from "next";
import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** LR-2 (2026-11-20, launch check): a friendly page for a link that leads nowhere, instead of the framework's bare 404. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-5 px-4 py-16 md:px-6">
      <p className="text-sm font-semibold tracking-wide text-brand-800 uppercase dark:text-brand-300">404</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">This page isn&apos;t here</h1>
      <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
        The link may be old or mistyped. These are the places most people are looking for:
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/interview/simulator" className={primaryButton}>
          Practise with Zarina
        </Link>
        <Link href="/paths" className={secondaryButton}>
          Choose your AI role
        </Link>
        <Link href="/" className={secondaryButton}>
          Home
        </Link>
      </div>
    </main>
  );
}
