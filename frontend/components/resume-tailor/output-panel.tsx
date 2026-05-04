import { GeneratedResumeOutput, JDAnalysis, ResumeEvaluation } from "@/lib/types";
import {
  escapeRegExp,
  formatResumeOutput,
  normalizePublications,
  normalizeSkills,
} from "@/lib/resume-tailor-utils";

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="mb-2 text-xs font-bold uppercase text-slate-500">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 5).map((item, index) => (
            <li key={index} className="text-xs text-slate-700">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HighlightedText({
  text,
  keywords,
}: {
  text: string;
  keywords: string[];
}) {
  const cleanKeywords = keywords
    .filter((k) => k && k.length > 2)
    .map((k) => k.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (cleanKeywords.length === 0) return <>{text}</>;

  const regex = new RegExp(
    `(${cleanKeywords.map((k) => escapeRegExp(k)).join("|")})`,
    "gi"
  );

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = cleanKeywords.some(
          (k) => k.toLowerCase() === part.toLowerCase()
        );

        return isMatch ? (
          <strong
            key={index}
            className="rounded bg-yellow-100 px-1 font-semibold text-slate-950"
          >
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}

function Section({
  title,
  lines,
  keywords = [],
  onCopy,
}: {
  title: string;
  lines: string[];
  keywords?: string[];
  onCopy: (text: string) => void;
}) {
  const text = lines.filter(Boolean).join("\n");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {title}
        </h3>
        <button
          onClick={() => onCopy(text)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium hover:border-violet-300 hover:text-violet-700"
        >
          Copy
        </button>
      </div>

      <div className="space-y-1 text-sm leading-6 text-slate-700">
        {lines.filter(Boolean).map((line, index) => (
          <p key={index}>
            <HighlightedText text={line} keywords={keywords} />
          </p>
        ))}
      </div>
    </section>
  );
}

export function OutputPanel({
  output,
  jdAnalysis,
  masterEvaluation,
  finalEvaluation,
}: {
  output: GeneratedResumeOutput | null;
  jdAnalysis?: JDAnalysis | null;
  masterEvaluation?: ResumeEvaluation | null;
  finalEvaluation?: ResumeEvaluation | null;
}) {
  if (!output) {
    return (
      <section className="overflow-y-auto rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <h2 className="mb-2 text-xl font-bold">Generated Resume</h2>
        <p className="text-sm text-slate-500">
          Generate a resume version to see section-wise output here.
        </p>
      </section>
    );
  }

  const skills = normalizeSkills(output.skills);
  const publications = normalizePublications(output.publications);
  const highlightKeywords = [
    ...(jdAnalysis?.keywords ?? []),
    ...(jdAnalysis?.must_have_skills ?? []),
  ];

  return (
    <section className="overflow-y-auto rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
            Preview
          </p>
          <h2 className="text-xl font-bold">Generated Resume</h2>
        </div>

        <button
          onClick={() => navigator.clipboard.writeText(formatResumeOutput(output))}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-violet-300 hover:text-violet-700"
        >
          Copy Full Resume
        </button>
      </div>

      {masterEvaluation && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Alignment Score (for master profile)
              </p>
              <h3 className="text-2xl font-bold">
                {masterEvaluation.score}/100
              </h3>
            </div>

            <div className="h-3 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{ width: `${Math.min(masterEvaluation.score, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {finalEvaluation && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Alignment Score (for final resume)
              </p>
              <h3 className="text-2xl font-bold">
                {finalEvaluation.score}/100
              </h3>
            </div>

            <div className="h-3 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{ width: `${Math.min(finalEvaluation.score, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniList title="Strengths" items={finalEvaluation.strengths} />
            <MiniList
              title="Missing Keywords"
              items={finalEvaluation.missing_keywords}
            />
            <MiniList title="Weak Points" items={finalEvaluation.weak_points} />
            <MiniList
              title="Suggestions"
              items={finalEvaluation.improvement_suggestions}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Section
          title="Profile"
          lines={output.profile}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Professional Experience"
          lines={output.experience.flatMap((exp) => [
            `${exp.company} — ${exp.title}`,
            `${exp.date_range}${exp.location ? ` | ${exp.location}` : ""}`,
            ...exp.bullets.map((bullet) => `• ${bullet}`),
            "",
          ])}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Skills"
          lines={skills.map((section) => `${section.name}: ${section.skills.join(", ")}`)}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Education"
          lines={output.education.flatMap((edu) => [
            `${edu.institution} — ${edu.degree}`,
            `${edu.date_range}${edu.location ? ` | ${edu.location}` : ""}`,
            ...edu.details.map((detail) => `• ${detail}`),
            "",
          ])}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Projects"
          lines={output.projects.flatMap((project) => [
            project.title,
            ...project.bullets.map((bullet) => `• ${bullet}`),
            "",
          ])}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Publications"
          lines={publications.flatMap((pub) => [
            pub.title,
            ...pub.details.map((detail) => `• ${detail}`),
            "",
          ])}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />

        <Section
          title="Languages"
          lines={[output.languages.join(" | ")]}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          keywords={highlightKeywords}
        />
      </div>
    </section>
  );
}
