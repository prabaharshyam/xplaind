"use client";

import Script from "next/script";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { makeGoogleNonce } from "@/lib/account/google-nonce";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;

type GoogleId = {
  initialize(options: Record<string, unknown>): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

/**
 * AC-1a: "Continue with Google" with Google's own button, served on xplaind.in, so Google's
 * window says "Sign in to xplaind.in" (or the app name) instead of the Supabase address.
 * Until Google's script has loaded, or when no client id is set, the plain redirect button
 * (children) stays, so sign-in always works, with JavaScript off too.
 */
export function GoogleButton({ next, adultId, children }: { next: string; adultId: string; children: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = slot.current;
    const gis = window.google?.accounts?.id;
    if (!CLIENT_ID || !loaded || !el || !gis) return;
    let live = true;
    void makeGoogleNonce().then(({ raw, hashed }) => {
      if (!live) return;
      gis.initialize({
        client_id: CLIENT_ID,
        nonce: hashed,
        ux_mode: "popup",
        auto_select: false,
        context: "signin",
        callback: ({ credential }: { credential?: string }) => {
          if (credential) post({ credential, nonce: raw, next, adult: (document.getElementById(adultId) as HTMLInputElement | null)?.checked ? "yes" : "" });
        },
      });
      gis.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "center",
        width: Math.max(200, Math.min(400, Math.round(el.getBoundingClientRect().width))),
      });
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [loaded, next, adultId]);

  if (!CLIENT_ID) return <>{children}</>;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      {/* Laid out but invisible until Google draws its button, so it can size itself to the column. */}
      <div ref={slot} data-google-button className={ready ? "flex min-h-12 justify-center" : "h-0 overflow-hidden"} />
      {!ready && children}
    </>
  );
}

/** A real form post to /auth/google, so the server sets the session cookies and redirects. */
function post(fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "post";
  form.action = "/auth/google";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}
