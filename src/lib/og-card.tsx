// SE-6: the picture a shared Xplaind link shows on WhatsApp, LinkedIn and X.
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

// The official wordmark, read the first time a share image is drawn, never when the module loads.
// The root share image is part of every page's metadata, so a read at load time ran on every
// dynamic page (such as /dashboard) and crashed it on Vercel when the file was not shipped there.
// If the file is ever missing, the card is drawn without the logo instead of failing.
let logo: string | null | undefined;
function wordmark(): string | null {
  if (logo === undefined) {
    try {
      const file = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "brand", "xplaind-wordmark.png");
      logo = `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
    } catch {
      logo = null;
    }
  }
  return logo;
}

export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({ eyebrow, title, footer, from, to }: { eyebrow: string; title: string; footer: string; from: string; to: string }) {
  const LOGO = wordmark();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 55%, #ecfeff 100%)`,
          color: "#17132a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img tags */}
          {LOGO ? <img src={LOGO} alt="" width={254} height={40} /> : <div style={{ fontSize: 34, fontWeight: 800 }}>XPLAIND</div>}
          <div style={{ width: 3, height: 34, borderRadius: 2, background: `linear-gradient(180deg, ${from}, ${to})`, marginLeft: 6 }} />
          <div style={{ fontSize: 26, color: "#6d28d9", fontWeight: 600 }}>{eyebrow}</div>
        </div>
        <div style={{ fontSize: title.length > 48 ? 64 : 78, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#3f3a56" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: from }} />
          {footer}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
