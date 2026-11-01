import Image from "next/image";

/**
 * The official Xplaind logo on a transparent background. The dark-ink version
 * shows on light pages and the light-ink version on dark pages.
 * `tagline` adds "AI, explained simply." under the wordmark.
 */
export function BrandLogo({ height, tagline = false, className = "" }: { height: number; tagline?: boolean; className?: string }) {
  const [w, h] = tagline ? [1008, 227] : [1008, 159];
  const name = tagline ? "xplaind-logo" : "xplaind-wordmark";
  const width = Math.round((w / h) * height);
  const alt = tagline ? "Xplaind: AI, explained simply." : "Xplaind";
  return (
    <span className={`inline-flex ${className}`}>
      <Image src={`/brand/${name}.png`} alt={alt} width={width} height={height} priority className="block dark:hidden" />
      <Image src={`/brand/${name}-dark.png`} alt={alt} width={width} height={height} priority className="hidden dark:block" />
    </span>
  );
}
