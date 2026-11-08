"use client";

import { secondaryButton } from "@/components/ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${secondaryButton} mt-6 print:hidden`}>
      Print or save as PDF
    </button>
  );
}
