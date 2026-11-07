import type { Metadata } from "next";
import Link from "next/link";
import { primaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Weekly emails stopped", robots: { index: false } };

/** CM-90: where the one-click unsubscribe lands. */
export default async function StoppedPage({ searchParams }: PageProps<"/commit/stopped">) {
  const failed = (await searchParams).error === "1";
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{failed ? "That link did not work" : "Weekly emails stopped"}</h1>
      <p className="mt-3 text-lg leading-8 text-zinc-700 dark:text-zinc-300">
        {failed
          ? "The link may be old or already used. You can stop the emails from your dashboard."
          : "You will not get any more weekly emails from Xplaind. Your progress and roadmap stay as they are, and you can start again from your dashboard."}
      </p>
      <Link href="/dashboard" className={`${primaryButton} mt-6`}>
        Go to my dashboard
      </Link>
    </main>
  );
}
