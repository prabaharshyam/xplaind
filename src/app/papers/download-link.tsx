"use client";

import { needAccount } from "@/lib/browser/account-sync";

/** LB-2: opens the authors' copy for signed-in learners; signed out, it opens the sign-up prompt instead. */
export function DownloadLink({ url, title, kind }: { url: string; title: string; kind: "paper" | "book" }) {
  const pdf = /\.pdf$|arxiv\.org\/pdf\//.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        if (!needAccount("library")) e.preventDefault();
      }}
      className="inline-flex min-h-11 items-center rounded-full bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
    >
      {pdf ? "Download PDF" : kind === "book" ? "Read free online" : "Open"}
      <span className="sr-only">: {title} (opens in a new tab)</span>
    </a>
  );
}
