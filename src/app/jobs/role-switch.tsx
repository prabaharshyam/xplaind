"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const onHash = (fn: () => void) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
const readHash = () => window.location.hash.slice(1);

/**
 * JB-5: one role at a time. The role comes from the address (/jobs#ai-engineer), so the roadmap's
 * link and the browser's Back button both work; every role's panel stays in the page, hidden, for
 * search engines and for anyone without scripts the first role shows.
 */
export function RoleSwitch({ roles }: { roles: { id: string; name: string; panel: ReactNode }[] }) {
  const hash = useSyncExternalStore(onHash, readHash, () => "");
  const current = roles.some((r) => r.id === hash) ? hash : roles[0].id;
  const go = (id: string) => {
    // Replace, not push: picking roles one after another should not fill the Back button.
    history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <label className="flex flex-col gap-2 lg:hidden">
        <span className="text-sm font-medium">Role</span>
        <select
          value={current}
          onChange={(e) => go(e.target.value)}
          className="min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <nav aria-label="Roles" className="hidden lg:block">
        <ul className="sticky top-24 flex flex-col gap-1">
          {roles.map((r) => (
            <li key={r.id}>
              <a
                href={`#${r.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(r.id);
                }}
                aria-current={r.id === current ? "true" : undefined}
                className="flex min-h-11 items-center rounded-2xl px-3 text-sm font-medium hover:bg-zinc-100 aria-[current]:bg-brand-50 aria-[current]:text-brand-900 dark:hover:bg-zinc-900 dark:aria-[current]:bg-brand-950/50 dark:aria-[current]:text-brand-100"
              >
                {r.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <ul className="min-w-0">
        {roles.map((r) => (
          <li key={r.id} id={r.id} hidden={r.id !== current} className="scroll-mt-24">
            {r.panel}
          </li>
        ))}
      </ul>
    </div>
  );
}
