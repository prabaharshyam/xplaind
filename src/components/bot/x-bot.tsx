"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { aiPost } from "@/components/ai/ai-client";
import { useAiAccess } from "@/components/ai/ai-gate";
import { AiText } from "@/components/ai/ai-text";
import { answer, BOT_KIND_LABEL, type BotEntry, entryForPage } from "@/lib/bot/answer";
import { read, write } from "@/lib/browser/storage";
import { XBotMascot } from "./x-bot-mascot";

type Link_ = { t: string; h: string; k?: BotEntry["k"] };
type Msg =
  | { from: "me"; text: string }
  | { from: "bot"; text: string; lead?: BotEntry; links?: Link_[]; ai?: boolean; signIn?: boolean };

let cache: Promise<BotEntry[]> | null = null;
const loadIndex = () =>
  (cache ??= fetch("/x-bot-index.json")
    .then((r) => (r.ok ? (r.json() as Promise<BotEntry[]>) : []))
    .catch(() => {
      cache = null;
      return [];
    }));

const KEY = "xplaind.xbot.v1";
const ABOUT_PAGE = "What is this page about?";
/** XB-1: no X Bot in the mock interview, where nobody coaches you (PRD, voice simulator step 3). */
const HIDDEN_ON = ["/interview/simulator"];

const GREETING = "Hi, I’m X Bot! Stuck on an AI word, a lesson or where to click? Ask me anything.";

/**
 * XB-1 to XB-3: X Bot, the little helper that floats on every page. It answers from
 * Xplaind's own lessons, glossary, interview questions and how-to notes for everyone,
 * and in its own words with AI for signed-in learners when AI is on. Nothing is saved.
 */
export function XBot({ aiOn }: { aiOn: boolean }) {
  const pathname = usePathname();
  const access = useAiAccess(aiOn);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<BotEntry[] | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();

  // Eyes follow the pointer; the bot leans while the page scrolls.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let stopLean = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = root.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        el.style.setProperty("--xb-look-x", Math.max(-1, Math.min(1, dx * 2)).toFixed(2));
        el.style.setProperty("--xb-look-y", Math.max(-1, Math.min(1, dy * 2)).toFixed(2));
      });
    };
    const onScroll = () => {
      root.current?.setAttribute("data-leaning", "");
      clearTimeout(stopLean);
      stopLean = window.setTimeout(() => root.current?.removeAttribute("data-leaning"), 220);
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(stopLean);
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", onScroll);
    };
  }, []);

  // Say hello once, a few seconds into the first visit.
  useEffect(() => {
    if (read(KEY)) return;
    const t = setTimeout(() => setHint(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [msgs, busy]);

  const ensureIndex = () => loadIndex().then((e) => (setEntries(e), e));

  const show = () => {
    setOpen(true);
    setHint(false);
    write(KEY, "1");
    void ensureIndex();
    requestAnimationFrame(() => input.current?.focus());
  };
  const hide = () => {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  };

  if (HIDDEN_ON.includes(pathname)) return null;

  const pageEntry = entries ? entryForPage(pathname, entries) : undefined;
  const starters = [
    ...(pageEntry ? [ABOUT_PAGE] : []),
    "Where should I start?",
    "What is RAG?",
    "How do I mark a topic done?",
    "Give me a project to build",
  ];

  const siteReply = (q: string, all: BotEntry[]): Msg => {
    const here = entryForPage(pathname, all);
    if (q === ABOUT_PAGE && here) return { from: "bot", text: "This page is about:", lead: here };
    const a = answer(q, all);
    if (a.lead) return { from: "bot", text: "Here’s what Xplaind says:", lead: a.lead, links: a.more };
    if (a.more.length) return { from: "bot", text: "These should help:", links: a.more };
    return {
      from: "bot",
      text: "Hmm, I couldn’t find that on Xplaind yet. Try fewer or different words, like “embeddings” or “interview”, or look it up in the glossary.",
      links: [{ t: "Open the glossary", h: "/glossary", k: "guide" }],
      signIn: access === "signed-out",
    };
  };

  const send = async (text: string) => {
    const q = text.trim().slice(0, 1500);
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { from: "me", text: q }];
    setMsgs(next);
    setDraft("");
    setBusy(true);
    const all = entries ?? (await ensureIndex());
    const site = siteReply(q, all);
    if (access !== "on" || q === ABOUT_PAGE) {
      setMsgs([...next, site]);
      setBusy(false);
      return;
    }
    const turns = next.map((m) => ({ role: m.from === "me" ? ("user" as const) : ("assistant" as const), text: m.from === "me" ? m.text : (m.lead ? `${m.lead.t}: ${m.lead.a}` : m.text) }));
    const res = await aiPost<{ reply: string; lessons: { id: string; title: string }[] }>("/api/ai/bot", {
      turns,
      page: { path: pathname.slice(0, 200), title: document.title.slice(0, 200) },
    });
    setBusy(false);
    if (!res.ok) {
      setMsgs([...next, { ...site, text: `${res.message} Meanwhile, here’s what I found on Xplaind:` }]);
      return;
    }
    const lessonLinks: Link_[] = res.data.lessons.map((l) => ({ t: l.title, h: `/stop/${l.id}`, k: "lesson" }));
    const siteLinks: Link_[] = [...(site.from === "bot" && site.lead ? [site.lead] : []), ...(site.from === "bot" ? (site.links ?? []) : [])];
    const links = [...lessonLinks, ...siteLinks.filter((s) => !lessonLinks.some((l) => l.h === s.h))].slice(0, 5);
    setMsgs([...next, { from: "bot", text: res.data.reply, ai: true, links }]);
  };

  const onLink = () => {
    if (matchMedia("(max-width: 639px)").matches) setOpen(false);
  };

  return (
    <div ref={root} className="xbot-root fixed right-3 bottom-3 z-40 print:hidden sm:right-5 sm:bottom-5" data-open={open || undefined}>
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={(e) => {
            if (e.key === "Escape") hide();
          }}
          className="xbot-panel fixed inset-x-2 bottom-2 flex h-[min(82dvh,640px)] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[390px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-500 px-4 py-3 text-white">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
              <XBotMascot size={38} mood={busy ? "talking" : "happy"} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg leading-tight font-semibold">
                X Bot
              </h2>
              <p className="text-xs text-white/90">{access === "on" ? "Answers with AI and Xplaind’s lessons" : "Instant answers from Xplaind"}</p>
            </div>
            <button type="button" onClick={hide} aria-label="Close X Bot" className="grid size-10 place-items-center rounded-full hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <BotBubble msg={{ from: "bot", text: GREETING }} onLink={onLink} />
            {msgs.map((m, i) => (m.from === "me" ? <MeBubble key={i} text={m.text} /> : <BotBubble key={i} msg={m} onLink={onLink} next={pathname} />))}
            {busy && (
              <p role="status" className="flex items-center gap-2 pl-10 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="size-2 animate-bounce rounded-full bg-teal-500" />
                <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
                <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
                X Bot is thinking…
              </p>
            )}
            {!busy && (
              <div className="flex flex-wrap gap-2 pl-10" aria-label="Suggested questions" role="group">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5 text-left text-sm text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className="flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Ask X Bot</span>
              <textarea
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                rows={1}
                maxLength={1500}
                placeholder="Ask a doubt…"
                className="max-h-28 min-h-11 w-full resize-none rounded-2xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              />
            </label>
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50">
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-zinc-600 dark:text-zinc-400">
            {access === "on" ? "AI can be wrong. Chats are not saved; your message goes to Anthropic only to write the answer." : "Not saved. Answers come from Xplaind’s own pages."}
          </p>
        </section>
      )}

      {hint && !open && (
        <button type="button" onClick={show} className="xbot-hint absolute right-1 bottom-[4.5rem] w-max max-w-[14rem] rounded-2xl rounded-br-sm bg-zinc-900 px-3 py-2 text-left text-sm text-white shadow-lg dark:bg-white dark:text-zinc-900">
          Stuck? Ask me anything!
        </button>
      )}

      <button
        ref={launcher}
        type="button"
        onClick={() => (open ? hide() : show())}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close X Bot" : "Ask X Bot for help"}
        className={`xbot-launcher relative grid size-16 place-items-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${open ? "max-sm:hidden" : ""}`}
      >
        <span className="xbot-float block">
          <XBotMascot size={60} mood={open ? "wave" : "happy"} />
        </span>
        <span aria-hidden="true" className="xbot-shadow absolute -bottom-0.5 left-1/2 h-2 w-9 -translate-x-1/2 rounded-full bg-black/20 blur-[2px] dark:bg-black/60" />
      </button>
    </div>
  );
}

function MeBubble({ text }: { text: string }) {
  return (
    <div className="xbot-msg flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-900 px-3.5 py-2.5 whitespace-pre-wrap text-white dark:bg-white dark:text-zinc-900">
        <span className="sr-only">You asked: </span>
        {text}
      </p>
    </div>
  );
}

function BotBubble({ msg, onLink, next = "/" }: { msg: Extract<Msg, { from: "bot" }>; onLink: () => void; next?: string }) {
  return (
    <div className="xbot-msg flex gap-2">
      <span className="mt-0.5 shrink-0">
        <XBotMascot size={30} />
      </span>
      <div className="max-w-[85%] min-w-0 rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-800">
        <p className="sr-only">X Bot said:</p>
        {msg.ai ? <AiText text={msg.text} /> : <p>{msg.text}</p>}
        {msg.lead && (
          <div className="mt-2 rounded-xl bg-white p-3 dark:bg-zinc-900">
            <p className="text-xs font-medium text-teal-800 dark:text-teal-300">{BOT_KIND_LABEL[msg.lead.k]}</p>
            <p className="font-semibold">{msg.lead.t}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{msg.lead.a}</p>
            {msg.lead.h !== next && (
              <Link href={msg.lead.h} onClick={onLink} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
                Open it <Icon name="send" size={14} />
              </Link>
            )}
          </div>
        )}
        {msg.links && msg.links.length > 0 && (
          <ul className="mt-2 space-y-1.5 text-sm">
            {msg.links.map((l) => (
              <li key={l.h}>
                <Link href={l.h} onClick={onLink} className="font-medium text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
                  {l.k ? `${BOT_KIND_LABEL[l.k]}: ` : ""}
                  {l.t}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {msg.signIn && (
          <p className="mt-2 text-sm">
            <Link href={`/signin?next=${encodeURIComponent(next)}`} onClick={onLink} className="font-medium underline underline-offset-2">
              Sign in
            </Link>{" "}
            and I can answer anything in my own words.
          </p>
        )}
      </div>
    </div>
  );
}
