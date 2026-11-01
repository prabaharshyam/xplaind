// SE-6: the picture a shared Xplaind link shows on WhatsApp, LinkedIn and X.
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({ eyebrow, title, footer, from, to }: { eyebrow: string; title: string; footer: string; from: string; to: string }) {
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
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${from}, ${to})` }} />
          <div style={{ fontSize: 30, fontWeight: 700, color: "#4c1d95" }}>Xplaind</div>
          <div style={{ fontSize: 26, color: "#6d28d9", marginLeft: 12 }}>{eyebrow}</div>
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
