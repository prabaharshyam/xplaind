import type { Metadata } from "next";
import Link from "next/link";
import { card, muted, textLink } from "@/components/ui";
import { getCertifications, getContent, getPath, getResource } from "@/lib/content";
import { formatDay } from "@/lib/roadmap/cost";

export const metadata: Metadata = {
  title: "AI certifications in 2026: fees, format and free prep",
  description:
    "AI certifications from AWS, Microsoft, Google Cloud, NVIDIA and Databricks: who each suits, what it covers, the exam fee with the date we checked it, and the free courses that prepare you.",
  alternates: { canonical: "/certifications" },
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Paid exams with free prep (RM-6: a fee always shows its check date), then free certificates of completion. */
export default function CertificationsPage() {
  const certs = getCertifications();
  const freeCerts = getContent()
    .resources.map((r) => r.data)
    .filter((r) => r.certificate && r.cost === "free")
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.title.localeCompare(b.title));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">AI certifications</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        A certification will not get you hired on its own; projects you can show will. A certification does help when a
        job asks for one, or when you need a reason to finish a syllabus. The exams below cost money, but every one can be
        prepared for with free courses.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Exams worth considering</h2>
      <ul className="mt-4 flex flex-col gap-4">
        {certs.map((c) => (
          <li key={c.id} id={c.id} className={card}>
            <h3 className="text-lg font-semibold">{c.name}</h3>
            <p className={`mt-1 text-sm ${muted}`}>
              {c.provider}
              {c.exam_code ? ` · exam ${c.exam_code}` : ""} · {c.level} · {c.format}
            </p>
            <dl className="mt-3 flex flex-col gap-2 leading-7">
              <div>
                <dt className="font-medium">Who it suits</dt>
                <dd>{c.audience}</dd>
              </div>
              <div>
                <dt className="font-medium">What it covers</dt>
                <dd>{c.covers}</dd>
              </div>
              <div>
                <dt className="font-medium">Exam fee</dt>
                <dd>
                  {c.fee_usd !== undefined && c.fee_checked_on
                    ? `${usd.format(c.fee_usd)} plus tax (checked on ${formatDay(c.fee_checked_on)})`
                    : c.fee_note}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Free prep</dt>
                <dd>
                  <ul className="list-disc pl-6">
                    {c.prep.map((id) => {
                      const r = getResource(id)!;
                      return (
                        <li key={id}>
                          <a href={`/go/${id}`} target="_blank" rel="noopener" className={textLink}>
                            {r.title}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>{" "}
                          <span className={`text-sm ${muted}`}>{r.provider}</span>
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Fits these paths</dt>
                <dd>
                  {c.paths.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ", "}
                      <Link href={`/roadmap/${id}`} className={textLink}>
                        {getPath(id)?.name ?? id}
                      </Link>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <p className="mt-3">
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
      <ul className="mt-4 flex flex-col gap-2">
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
    </main>
  );
}
