import { BrandLoader } from "@/components/brand-loader";

/** UX-2: shown while a page that is not ready yet loads, instead of a blank screen. */
export default function Loading() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <BrandLoader label="Getting your page ready" />
    </main>
  );
}
