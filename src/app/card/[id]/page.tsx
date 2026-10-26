import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { primaryButton } from "@/components/ui";
import { getPublicCard } from "@/lib/account/cards";

export const metadata: Metadata = { title: "Level card", robots: { index: false } };

async function Card({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // a deleted card must disappear at once, so never serve a cached copy
  const card = await getPublicCard((await params).id);
  if (!card) notFound();
  return (
    <>
      <div className="flex aspect-[1200/630] w-full flex-col justify-between rounded-2xl bg-emerald-800 p-6 text-white">
        <p className="text-sm font-medium tracking-wide opacity-90">{card.goal} path</p>
        <div>
          {card.name && <p className="text-lg">{card.name} is at</p>}
          <p className="text-4xl font-bold">
            {card.level} {card.levelName}
          </p>
        </div>
        <p className="text-sm opacity-90">
          {card.weeksActive} {card.weeksActive === 1 ? "week" : "weeks"} active · {card.site}
        </p>
      </div>
      <p className="mt-6 leading-7">Find your own level with a short test, then follow the next five steps.</p>
      <Link href="/start" className={`mt-4 ${primaryButton}`}>
        Find my level
      </Link>
    </>
  );
}

export default function CardPage({ params }: PageProps<"/card/[id]">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="sr-only">Level card</h1>
      <Suspense>
        <Card params={params} />
      </Suspense>
    </main>
  );
}
