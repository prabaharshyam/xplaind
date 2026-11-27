"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/art/icons";
import { useAccountState } from "@/components/account-link";
import { TABS, activeTab, tabBarHidden } from "@/lib/nav";

/**
 * NV-11 (2026-11-27, owner: "fix/do the 4-12", item 12): on a phone, a signed-in learner gets a tab bar at the
 * bottom for the four places they come back to. Signed out, or before the account is known, there is no bar,
 * so nothing appears and then vanishes. It stays off pages with their own bottom bar (a lesson, the mock interview).
 */
export function PhoneTabBar() {
  const path = usePathname() ?? "/";
  const account = useAccountState();
  if (account !== "in" || tabBarHidden(path)) return null;
  const current = activeTab(path);
  return (
    <nav aria-label="Your places" className="xp-tabbar xp-glass-strong fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 rounded-[1.75rem] px-1 py-1 sm:hidden print:hidden">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => (
          <li key={t.id}>
            <Link
              href={t.href}
              aria-current={current === t.id ? "page" : undefined}
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.5rem] text-xs font-medium text-zinc-700 aria-[current]:bg-brand-50 aria-[current]:text-brand-900 dark:text-zinc-300 dark:aria-[current]:bg-white/10 dark:aria-[current]:text-white"
            >
              <Icon name={t.icon} size={20} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
