// RM-6: cost labels. Pure. A price is never returned without its check date.
import { daysBetween } from "@/lib/dates";

/** RM-6: after this many days the label adds "price may have changed". */
export const PRICE_STALE_DAYS = 60;

export type Costed = {
  cost: "free" | "free_cert_paid" | "paid";
  price_inr?: number;
  price_checked_on?: string;
};

export type CostLabel = { label: string; note?: string };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Formats a date as "25 Oct 2026". Dates are calendar dates in India, so no time zone shift. */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/**
 * `today` is optional: a page prerendered at build time does not know today's
 * date, so it shows the price with its check date and adds the "may have changed"
 * note once the browser supplies today.
 */
export function costLabel(r: Costed, today?: string): CostLabel {
  if (r.cost === "free") return { label: "Free" };
  if (r.cost === "free_cert_paid" && r.price_inr === undefined) return { label: "Free to learn, paid certificate" };
  if (r.price_inr === undefined || !r.price_checked_on) {
    // The schema forbids this; keep the promise anyway and never show a bare price.
    return { label: r.cost === "paid" ? "Paid" : "Free to learn, paid certificate", note: "price not checked yet" };
  }
  const price = inr.format(r.price_inr);
  const label = r.cost === "paid" ? price : `Free to learn, certificate ${price}`;
  const checked = `price checked on ${formatDay(r.price_checked_on)}`;
  const stale = today !== undefined && daysBetween(r.price_checked_on, today) > PRICE_STALE_DAYS;
  return { label, note: stale ? `${checked}; price may have changed` : checked };
}
