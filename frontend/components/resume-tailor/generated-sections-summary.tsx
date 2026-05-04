import type { GeneratedResumeOutput } from "@/lib/types";

export function GeneratedSectionsSummary({
  output,
}: {
  output: GeneratedResumeOutput | null;
}) {
  const sections = [
    "Profile Summary",
    "Professional Experience",
    "Skills",
    "Education",
    "Projects",
    "Publications",
    "Languages",
  ];

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
        Generated Sections
      </h3>

      <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50">
        {sections.map((section) => (
          <div
            key={section}
            className="flex items-center justify-between px-3 py-3"
          >
            <span className="text-sm font-medium text-slate-700">
              {section}
            </span>
            <span
              className={`text-xs font-medium ${
                output ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {output ? "✓ Generated" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
