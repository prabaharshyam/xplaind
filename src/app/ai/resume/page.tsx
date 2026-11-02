import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getPaths } from "@/lib/content";
import { ResumeStudio } from "./resume-studio";

export const metadata: Metadata = {
  title: "Free AI resume review for AI and tech jobs",
  description:
    "Upload your resume and get a list of fixes that help it get shortlisted: what recruiters and applicant tracking systems look for, rewritten lines and missing keywords. No account needed.",
  alternates: { canonical: "/ai/resume" },
};

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
