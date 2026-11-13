import Image from "next/image";
import { Cover } from "@/components/art/cover";
import type { ThemeId } from "@/lib/themes";

/** BL-1: a guide's cover picture, or its generated pattern when it has none yet. */
export function GuideCover({
  cover,
  theme,
  seed,
  className = "h-36",
}: {
  cover?: { src: string; alt: string };
  theme: ThemeId;
  seed: string;
  className?: string;
}) {
  if (!cover) return <Cover theme={theme} seed={seed} icon="book" className={className} iconSize={40} />;
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <Image
        src={cover.src}
        alt="" // the card title names the link; the guide page carries the alt text
        fill
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
      />
    </span>
  );
}
