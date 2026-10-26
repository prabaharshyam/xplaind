import type { Metadata } from "next";
import { DEFAULT_PATH_ID } from "@/lib/paths";
import { getPath } from "@/lib/content";
import { TestPage } from "./test-page";

export const metadata: Metadata = {
  title: "Find my level",
  description: "A short test finds your level, so your roadmap skips what you already know. No sign-up needed.",
};

export default function StartPage() {
  return <TestPage goal={getPath(DEFAULT_PATH_ID)!} />;
}
