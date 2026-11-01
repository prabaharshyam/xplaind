"use client";

import { useSearchParams } from "next/navigation";
import { SignInForm as Form } from "@/components/account/signin-form";
import type { SignUpReason } from "@/lib/browser/account-sync";

const REASON_IDS = ["pdf", "interview", "progress", "practice"] as const;

/** The sign-in page's form, driven by the address: ?next, ?reason, ?error, ?sent and ?mode. */
export function SignInForm() {
  const params = useSearchParams();
  const reason = params.get("reason");
  return (
    <div className="mt-6">
      <Form
        next={params.get("next") ?? "/dashboard"}
        reason={(REASON_IDS as readonly string[]).includes(reason ?? "") ? (reason as SignUpReason) : undefined}
        error={params.get("error")}
        sent={params.get("sent")}
        initialMode={params.get("mode") === "signin" ? "signin" : "signup"}
      />
    </div>
  );
}
