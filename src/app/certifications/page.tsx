import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { card, muted, textLink } from "@/components/ui";
import { getCertifications, getContent, getPath, getResource } from "@/lib/content";
import { formatDay } from "@/lib/roadmap/cost";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Certifications 2026: Exam Fees & Prep Courses", "AI Certifications: Fees & Prep"],
  description:
    "AI certifications from AWS, Microsoft, Google Cloud, NVIDIA and Databricks: who each suits, the exam fee with its check date, and free courses to prepare.",
  path: "/certifications",
});

/** US dollars, labelled so nobody reads them as rupees. */
const usd = (n: number) => `US$${n.toLocaleString("en-IN")}`;

/** Paid exams with free prep (RM-6: a fee always shows its check date), then free certificates of completion. */
export default function CertificationsPage() {
  const certs = getCertifications();
  const freeCerts = getContent()
    .resources.map((r) => r.data)
    .filter((r) => r.certificate && r.cost === "free")
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.title.localeCompare(b.title));

  return (
    <main>
      <PageHero shape="medal"
        theme="career"
        seed="certifications"
        icon="cert"
        eyebrow="Certifications"
        title="AI certifications"
        lead="Exams from AWS, Microsoft, Google Cloud, NVIDIA and Databricks: who each suits, what it costs and the free courses that prepare you. A certification helps when a job asks for one; projects you can show matter more."
      />
      <div className="mx-auto max-w-5xl px-4 py-8">

      <h2 className="mt-10 text-xl font-semibold">Exams worth considering</h2>
      {/* UX-22 (2026-11-27, owner: "don't have sections with so much text"): each exam is a short card: name, chips, the
          fee with its check date and the roles it fits. Who it suits, what it covers and the free prep open on tap. */}
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {certs.map((c) => (
          <li key={c.id} id={c.id} className={`${card} flex flex-col`}>
            <h3 className="text-lg leading-snug font-semibold">{c.name}</h3>
            <p className={`mt-1 text-sm ${muted}`}>
              {c.provider}
              {c.exam_code ? ` · exam ${c.exam_code}` : ""}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium">
              {[c.level].map((t) => (
                <li key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {t}
                </li>
              ))}
              {c.paths.map((id) => (
                <li key={id}>
                  <Link href={`/roadmap/${id}`} className="inline-block rounded-full bg-brand-50 px-2.5 py-1 text-brand-900 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200">
                    {getPath(id)?.name ?? id}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={`mt-3 text-sm ${c.fee_usd !== undefined ? "font-medium" : muted}`}>
              {c.fee_usd !== undefined && c.fee_checked_on ? `${usd(c.fee_usd)} plus tax (checked on ${formatDay(c.fee_checked_on)})` : c.fee_note}
            </p>
            <details className="group mt-3">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-brand-800 dark:text-brand-300 [&::-webkit-details-marker]:hidden">
                Format, who it suits, free prep
                <span aria-hidden="true" className="transition-transform group-open:rotate-90">→</span>
              </summary>
              <dl className="mt-2 flex flex-col gap-2 text-sm leading-6">
                <div>
                  <dt className="font-medium">Format</dt>
                  <dd>{c.format}</dd>
                </div>
                <div>
                  <dt className="font-medium">Who it suits</dt>
                  <dd>{c.audience}</dd>
                </div>
                <div>
                  <dt className="font-medium">What it covers</dt>
                  <dd>{c.covers}</dd>
                </div>
                <div>
                  <dt className="font-medium">Free prep</dt>
                  <dd>
                    <ul className="list-disc pl-5">
                      {c.prep.map((id) => {
                        const r = getResource(id)!;
                        return (
                          <li key={id}>
                            <a href={`/go/${id}`} target="_blank" rel="noopener" className={textLink}>
                              {r.title}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>{" "}
                            <span className={muted}>{r.provider}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </dd>
                </div>
              </dl>
            </details>
            <p className="mt-auto pt-2 text-sm">
              <a href={c.official_url} target="_blank" rel="noopener" className={textLink}>
                Official exam page<span className="sr-only"> for {c.name} (opens in a new tab)</span>
              </a>
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-semibold">Free courses that give a certificate or badge</h2>
      <p className={`mt-2 leading-7 ${muted}`}>
        These cost nothing and end with a certificate of completion or a badge you can add to LinkedIn. They show you
        finished a course, not that you passed a proctored exam.
      </p>
      <ul className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2">
        {freeCerts.map((r) => (
          <li key={r.id} className="leading-7">
            <a href={`/go/${r.id}`} target="_blank" rel="noopener" className={textLink}>
              {r.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            <span className={`text-sm ${muted}`}>
              {r.provider} · about {r.hours} h
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/resources" className={textLink}>
          Browse every free course
        </Link>
      </p>
      </div>
    </main>
  );
}
