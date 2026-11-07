import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { primaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Weekly emails stopped", robots: { index: false } };

const TEXT = {
  ok: ["Weekly emails stopped", "You will not get any more weekly emails from Xplaind. Your progress and roadmap stay as they are, and you can start again from your dashboard."],
  failed: ["That link did not work", "The link may be old or already used. You can stop the emails from your dashboard."],
} as const;

/** CM-90: where the one-click unsubscribe lands. */
export default function StoppedPage({ searchParams }: PageProps<"/commit/stopped">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Suspense fallback={<Message kind="ok" />}>
        <Result searchParams={searchParams} />
      </Suspense>
      <Link href="/dashboard" className={`${primaryButton} mt-6`}>
        Go to my dashboard
      </Link>
    </main>
  );
}

async function Result({ searchParams }: { searchParams: PageProps<"/commit/stopped">["searchParams"] }) {
  return <Message kind={(await searchParams).error === "1" ? "failed" : "ok"} />;
}

function Message({ kind }: { kind: keyof typeof TEXT }) {
  const [title, body] = TEXT[kind];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-lg leading-8 text-zinc-700 dark:text-zinc-300">{body}</p>
    </>
  );
}
