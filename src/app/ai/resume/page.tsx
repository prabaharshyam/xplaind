import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getPaths } from "@/lib/content";
import { ResumeStudio } from "./resume-studio";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["Free AI Resume Review for AI & Tech Jobs (ATS Check)", "Free AI Resume Review (ATS Check)"],
  description:
    "Free AI resume checker for AI and tech jobs in India: see what recruiters and ATS look for, with rewritten lines and the keywords you are missing.",
  path: "/ai/resume",
});

export default function ResumePage() {
  return (
    <main>
      <PageHero
        shape="resume"
        theme="career"
        seed="resume"
        icon="star"
        eyebrow="AI tools · Resume review"
        title="Get your resume shortlisted"
        lead="Upload your resume and the role you want. You get a clear list of fixes, most important first: what a recruiter and an applicant tracking system will look for, with rewritten lines you can adapt."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <ResumeStudio enabled={aiEnabled()} roles={getPaths().map((p) => p.name)} />
      </div>
    </main>
  );
}
