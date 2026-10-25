import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-medium tracking-wide text-emerald-700 dark:text-emerald-400">
        xplaind.ai
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance">
        Learn AI, in the right order.
      </h1>
      <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        A short test finds your level. Then you get the next five steps, each
        with the best free or low-cost course. No ads, no paid placement.
      </p>
      <Link
        href="/start"
        className="inline-flex min-h-12 w-fit items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Find my level
      </Link>
    </main>
  );
}
