"use client";

import { secondaryButton } from "@/components/ui";

/** IQ-8: the whole Top 25 prints, or saves as a PDF, with the browser's print dialog. */
export function PrintButton() {
  return (
    <button type="button" className={`${secondaryButton} print:hidden`} onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
