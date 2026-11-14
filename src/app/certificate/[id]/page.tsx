import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/skeleton";
import { primaryButton } from "@/components/ui";
import { linkedInAddUrl } from "@/lib/certificates";
import { getPath } from "@/lib/content";
import { serviceClient } from "@/lib/supabase/server";

// CT-1: a certificate anyone can verify by its link. Not indexed by search engines.
export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

const SITE = "https://xplaind.in";

async function Certificate({ params }: { params: PageProps<"/certificate/[id]">["params"] }) {
  const { id } = await params;
  const admin = serviceClient();
  if (!/^[a-z0-9]{10}$/.test(id) || !admin) notFound();
  const { data: c } = await admin.from("certificates").select("id, path_id, name_on_certificate, issued_at").eq("id", id).maybeSingle();
  if (!c) notFound();
  const path = getPath(c.path_id);
  const title = `${path?.name ?? c.path_id} roadmap`;
  const issued = new Date(c.issued_at);
  const date = issued.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <>
      <article className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-14 dark:border-zinc-800 dark:bg-zinc-900 print:border-zinc-400 print:shadow-none">
        <div className="flex justify-center">
          <BrandLogo height={32} />
        </div>
        <p className="mt-8 font-mono text-sm text-zinc-500 dark:text-zinc-400">Certificate of completion</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{c.name_on_certificate}</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700 dark:text-zinc-300">completed the</p>
        <p className="mt-1 font-display text-2xl font-semibold md:text-3xl">{title}</p>
        <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-700 dark:text-zinc-300">
          Every lesson on the roadmap done, most by passing the lesson check, and a guided project that passed review against its rubric.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Issued</dt>
            <dd className="mt-1 font-medium">{date}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Certificate ID</dt>
            <dd className="mt-1 font-mono font-medium">{c.id}</dd>
          </div>
        </dl>
      </article>
      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <a className={primaryButton} href={linkedInAddUrl({ title: `Xplaind: ${title}`, issuedAt: issued, url: `${SITE}/certificate/${c.id}`, id: c.id })} target="_blank" rel="noopener noreferrer">
          Add to LinkedIn
        </a>
      </div>
      <p className="mt-6 text-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Issued by Xplaind, a brand of ZEREH Venture, and verified at this address. It is not a university or government-accredited qualification.{" "}
        <Link href={path ? `/roadmap/${path.id}` : "/paths"} className="underline underline-offset-2">
          See the roadmap
        </Link>
        .
      </p>
    </>
  );
}

export default function CertificatePage({ params }: PageProps<"/certificate/[id]">) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Suspense fallback={<Skeleton label="Checking the certificate…" />}>
        <Certificate params={params} />
      </Suspense>
    </main>
  );
}
