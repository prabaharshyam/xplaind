import Link from "next/link";
import { textLink } from "@/components/ui";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Affiliate disclosure",
  description: "How Xplaind earns money from book links, and why it never changes what we recommend.",
  path: "/disclosure",
});

// BK-2: the sitewide disclosure page. Keep it true to the code: ordering ignores commission (ED-2).
export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="text-3xl font-semibold tracking-tight">Affiliate disclosure</h1>
      <p>
        Xplaind is a participant in the Amazon Associates Programme. As an Amazon Associate, we earn from qualifying purchases.
      </p>

      <h2>What this means for you</h2>
      <ul>
        <li>Every book link that earns us a commission says so, right under the link.</li>
        <li>You pay the same price whether or not you use our link.</li>
        <li>We never see who you are or what you buy. We only count how many times each book link is opened.</li>
      </ul>

      <h2>Commission never changes our picks</h2>
      <p>
        An editor picks each book and gives it a score from 0 to 5. Books are sorted by that score, then by level. The code that
        sorts books never reads whether a link earns money, and an automated test checks this on every change.
      </p>
      <p>
        Courses, videos and articles are ranked the same way. See <Link href="/how-we-rank" className={textLink}>how we rank</Link>.
      </p>

      <h2>No ads, no sponsored places</h2>
      <p>We do not show ads, and no one can pay to be listed or to move up.</p>
    </main>
  );
}
