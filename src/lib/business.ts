// BIZ-1: who runs Xplaind and how to reach them, in one place for the footer, Contact, policies and
// receipts. Payment gateways (Cashfree) check these against the merchant application.
export const BUSINESS = {
  brand: "Xplaind",
  legalName: "ZEREH Venture",
  gstin: "33GDZPS4274J1ZK",
  /** NEXT_PUBLIC_CONTACT_EMAIL can override it, for example while a mailbox is being set up. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "hello@xplaind.in",
  phone: "+91 8608761359",
  /** For tel: links: digits and the leading plus only. */
  phoneHref: "tel:+918608761359",
  /** Working hours for replies, India time. */
  hours: "Monday to Saturday, 10 am to 6 pm India time",
} as const;
