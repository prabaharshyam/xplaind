import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpDialog } from "@/components/account/signup-dialog";
import { XBot } from "@/components/bot/x-bot";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { MotionEffects, PageEnter } from "@/components/motion/motion-effects";
import { SiteMotion } from "@/components/motion/site-motion";
import { SiteFooter } from "@/components/site-footer";
import { NavProgress } from "@/components/nav-progress";
import { SiteHeader } from "@/components/site-header";
import { aiEnabled } from "@/lib/ai/settings";
import { allowIndexing } from "@/lib/indexing";
import { siteUrl } from "@/lib/site";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import "./globals.css";
import { THEME_SCRIPT } from "@/lib/browser/theme";

// BR-1: Bricolage Grotesque for headings (self-hosted from the package, so builds need no network);
// Geist stays for body text. One variable file covers every weight and optical size.
const display = localFont({
  src: "../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  // SE-3: absolute links, the site's name and share previews for every page.
  metadataBase: new URL(siteUrl()),
  title: { default: "Xplaind: learn AI step by step, for the AI job you want", template: "%s | Xplaind" },
  description:
    "Xplaind is an AI learning platform for India: step-by-step AI career roadmaps, plain-English lessons, hand-picked courses, projects and interview practice.",
  applicationName: "Xplaind",
  openGraph: { siteName: "Xplaind", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
  category: "education",
  // SE-8: Search Console and Bing Webmaster Tools ownership tags, set in Vercel once the owner has the codes.
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
          ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
        },
      }
    : {}),
  // Not listed in search results until launch (see src/lib/indexing.ts).
  ...(allowIndexing() ? {} : { robots: { index: false, follow: false } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable} h-full antialiased`}
      // BR-6: the theme script sets data-theme before React loads.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div id="page" className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <SignUpDialog />
        <UpgradePrompt />
        <MotionEffects />
        {/* These read the URL, so pages with dynamic URLs render them in the browser. */}
        <Suspense fallback={null}>
          <NavProgress />
          <PageEnter />
          <SiteMotion />
          <XBot aiOn={aiEnabled()} />
        </Suspense>
      </body>
    </html>
  );
}
