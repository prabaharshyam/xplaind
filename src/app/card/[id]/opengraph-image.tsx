// AC-7: the 1200 x 630 share image. Level, goal, weeks active, site and an optional first name; nothing else.
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { getPublicCard } from "@/lib/account/cards";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A Xplaind level card";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const card = await getPublicCard((await params).id);
  const level = card ? `${card.level} ${card.levelName}` : "Xplaind";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#065f46",
          color: "white",
          padding: 72,
          fontSize: 36,
        }}
      >
        <div style={{ display: "flex", opacity: 0.9 }}>{card ? `${card.goal} path` : "Learn AI, in the right order"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {card?.name ? <div style={{ display: "flex", fontSize: 44 }}>{card.name} is at</div> : null}
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>{level}</div>
        </div>
        <div style={{ display: "flex", opacity: 0.9 }}>
          {card ? `${card.weeksActive} ${card.weeksActive === 1 ? "week" : "weeks"} active · ${card.site}` : ""}
        </div>
      </div>
    ),
    size,
  );
}
