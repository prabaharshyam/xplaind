// Orders a stop's resources (RM-2, RM-9). Pure.
// ED-2: nothing in this file may read the affiliate or commission fields. The
// type below does not even carry them, and resources.test.ts checks the source.
export type Rankable = { id: string; cost: "free" | "free_cert_paid" | "paid" };

const isPaid = (r: Rankable) => r.cost === "paid";

/**
 * The editor's order is the stop file's order: primary first, then alternates.
 * With "Free only" on, paid resources move below the free ones and so are never
 * the primary, unless every resource is paid. The order is otherwise kept.
 */
export function orderResources<T extends Rankable>(editorOrder: readonly T[], opts: { freeOnly: boolean }): T[] {
  if (!opts.freeOnly) return [...editorOrder];
  return [...editorOrder.filter((r) => !isPaid(r)), ...editorOrder.filter(isPaid)];
}
