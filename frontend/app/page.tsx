"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApplicationTab,
  GeneratedResumeOutput,
  MasterProfile,
  TargetRole,
} from "@/lib/types";
import { defaultMasterProfile } from "@/lib/defaultState";

const API_URL = "http://127.0.0.1:8000";

const roleOptions: TargetRole[] = [
  "PM",
  "TPM",
  "Product Analyst",
  "Software Engineer",
  "Automation Engineer",
  "AI Engineer",
];

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

function listToText(value: string[] | undefined): string {
  return value?.join("\n") ?? "";
}

function createNewTab(index: number): ApplicationTab {
  return {
    id: crypto.randomUUID(),
    title: `Application ${index}`,
    targetRole: "TPM",
    jdText: "",
    additionalInstructions: "",
    output: null,
  };
}

export default function Home() {
  const [masterProfile, setMasterProfile] =
    useState<MasterProfile>(defaultMasterProfile);

  const [tabs, setTabs] = useState<ApplicationTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedMasterProfile = localStorage.getItem(
      "resume-tailor-master-profile"
    );
    const savedTabs = localStorage.getItem("resume-tailor-tabs");
    const savedActiveTabId = localStorage.getItem(
      "resume-tailor-active-tab-id"
    );

    if (savedMasterProfile) {
      setMasterProfile(JSON.parse(savedMasterProfile));
    }

    if (savedTabs) {
      const parsedTabs: ApplicationTab[] = JSON.parse(savedTabs);
      setTabs(parsedTabs);

      if (
        savedActiveTabId &&
        parsedTabs.some((tab) => tab.id === savedActiveTabId)
      ) {
        setActiveTabId(savedActiveTabId);
      } else if (parsedTabs.length > 0) {
        setActiveTabId(parsedTabs[0].id);
      }
    } else {
      const initialTab = createNewTab(1);
      setTabs([initialTab]);
      setActiveTabId(initialTab.id);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(
      "resume-tailor-master-profile",
      JSON.stringify(masterProfile)
    );
  }, [masterProfile, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("resume-tailor-tabs", JSON.stringify(tabs));
    localStorage.setItem("resume-tailor-active-tab-id", activeTabId);
  }, [tabs, activeTabId, isLoaded]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  function updateMasterProfile(value: Partial<MasterProfile>) {
    setMasterProfile((prev) => ({ ...prev, ...value }));
  }

  function updateBasics(field: string, value: string) {
    setMasterProfile((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: value,
      },
    }));
  }

  function updateSkills(group: keyof MasterProfile["skills"], value: string) {
    setMasterProfile((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [group]: textToList(value),
      },
    }));
  }

  function updateActiveTab(value: Partial<ApplicationTab>) {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTabId ? { ...tab, ...value } : tab))
    );
  }

  function addTab() {
    const newTab = createNewTab(tabs.length + 1);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }

  function deleteActiveTab() {
    if (tabs.length === 1) return;

    const filtered = tabs.filter((tab) => tab.id !== activeTabId);
    setTabs(filtered);
    setActiveTabId(filtered[0].id);
  }

  async function generateResume() {
    setError("");

    if (!activeTab.jdText.trim()) {
      setError("Please paste a JD before generating.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          master_profile: masterProfile,
          jd_text: activeTab.jdText,
          target_role: activeTab.targetRole,
          additional_instructions: activeTab.additionalInstructions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data: GeneratedResumeOutput = await response.json();

      updateActiveTab({
        output: data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function formatOutput(output: GeneratedResumeOutput): string {
    return [
      "PROFILE",
      ...output.profile.map((item) => `• ${item}`),
      "",
      "PROFESSIONAL EXPERIENCE",
      ...output.experience.flatMap((exp) => [
        `${exp.company} — ${exp.title}`,
        `${exp.date_range}${exp.location ? ` | ${exp.location}` : ""}`,
        ...exp.bullets.map((bullet) => `• ${bullet}`),
        "",
      ]),
      "SKILLS",
      `Tech & AI: ${output.skills.tech_and_ai.join(", ")}`,
      `Product: ${output.skills.product.join(", ")}`,
      `Data & Analytics: ${output.skills.data_and_analytics.join(", ")}`,
      "",
      "EDUCATION",
      ...output.education.flatMap((edu) => [
        `${edu.institution} — ${edu.degree}`,
        `${edu.date_range}${edu.location ? ` | ${edu.location}` : ""}`,
        ...edu.details.map((detail) => `• ${detail}`),
        "",
      ]),
      "PROJECTS",
      ...output.projects.flatMap((project) => [
        project.title,
        ...project.bullets.map((bullet) => `• ${bullet}`),
        "",
      ]),
      "PUBLICATIONS",
      ...output.publications.map((item) => `• ${item}`),
      "",
      "LANGUAGES",
      output.languages.join(" | "),
    ].join("\n");
  }

  if (!isLoaded || tabs.length === 0 || !activeTab) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold">Resume Tailor AI</h1>
        <p className="text-sm text-slate-500">
          Multi-tab JD-based resume content generator
        </p>
      </div>

      <div className="grid h-[calc(100vh-73px)] grid-cols-[420px_1fr]">
        <aside className="overflow-y-auto border-r bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Master Profile</h2>

          <div className="space-y-4">
            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Basics</h3>
              <div className="space-y-2">
                {[
                  "name",
                  "email",
                  "phone",
                  "portfolio",
                  "linkedin",
                  "location",
                ].map((field) => (
                  <input
                    key={field}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder={field}
                    value={
                      masterProfile.basics[
                        field as keyof typeof masterProfile.basics
                      ] ?? ""
                    }
                    onChange={(e) => updateBasics(field, e.target.value)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Profile Summary</h3>
              <textarea
                className="h-28 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One bullet per line"
                value={listToText(masterProfile.profile_summary)}
                onChange={(e) =>
                  updateMasterProfile({
                    profile_summary: textToList(e.target.value),
                  })
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Experience</h3>
              <textarea
                className="h-40 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="For MVP, paste key experience bullets, one per line"
                value={listToText(masterProfile.experiences[0]?.bullets ?? [])}
                onChange={(e) =>
                  updateMasterProfile({
                    experiences: [
                      {
                        company: "Master Experience",
                        title: "Source Content",
                        date_range: "",
                        location: "",
                        bullets: textToList(e.target.value),
                        tags: [],
                      },
                    ],
                  })
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Skills</h3>

              <label className="text-xs font-medium text-slate-500">
                Tech & AI
              </label>
              <textarea
                className="mb-2 h-20 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One skill per line"
                value={listToText(masterProfile.skills.tech_and_ai)}
                onChange={(e) => updateSkills("tech_and_ai", e.target.value)}
              />

              <label className="text-xs font-medium text-slate-500">
                Product
              </label>
              <textarea
                className="mb-2 h-20 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One skill per line"
                value={listToText(masterProfile.skills.product)}
                onChange={(e) => updateSkills("product", e.target.value)}
              />

              <label className="text-xs font-medium text-slate-500">
                Data & Analytics
              </label>
              <textarea
                className="h-20 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One skill per line"
                value={listToText(masterProfile.skills.data_and_analytics)}
                onChange={(e) =>
                  updateSkills("data_and_analytics", e.target.value)
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Projects</h3>
              <textarea
                className="h-32 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One project bullet per line"
                value={listToText(masterProfile.projects[0]?.bullets ?? [])}
                onChange={(e) =>
                  updateMasterProfile({
                    projects: [
                      {
                        title: "Projects",
                        bullets: textToList(e.target.value),
                        tags: [],
                      },
                    ],
                  })
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Education</h3>
              <textarea
                className="h-24 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="For now, one detail per line"
                value={listToText(masterProfile.education[0]?.details ?? [])}
                onChange={(e) =>
                  updateMasterProfile({
                    education: [
                      {
                        institution: "Education",
                        degree: "",
                        date_range: "",
                        location: "",
                        details: textToList(e.target.value),
                      },
                    ],
                  })
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Publications</h3>
              <textarea
                className="h-20 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One publication per line"
                value={listToText(masterProfile.publications)}
                onChange={(e) =>
                  updateMasterProfile({
                    publications: textToList(e.target.value),
                  })
                }
              />
            </section>

            <section className="rounded-xl border p-3">
              <h3 className="mb-3 font-medium">Languages</h3>
              <textarea
                className="h-20 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="One language per line"
                value={listToText(masterProfile.languages)}
                onChange={(e) =>
                  updateMasterProfile({
                    languages: textToList(e.target.value),
                  })
                }
              />
            </section>
          </div>
        </aside>

        <section className="overflow-y-auto p-4">
          <div className="mb-4 flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  tab.id === activeTabId
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {tab.title}
              </button>
            ))}

            <button
              onClick={addTab}
              className="rounded-lg bg-white px-3 py-2 text-sm"
            >
              + New Tab
            </button>

            <button
              onClick={deleteActiveTab}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              Delete
            </button>
          </div>

          <div className="grid grid-cols-[420px_1fr] gap-4">
            <div className="rounded-xl bg-white p-4">
              <h2 className="mb-4 text-lg font-semibold">JD Workspace</h2>

              <label className="text-xs font-medium text-slate-500">
                Tab Name
              </label>
              <input
                className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                value={activeTab.title}
                onChange={(e) => updateActiveTab({ title: e.target.value })}
              />

              <label className="text-xs font-medium text-slate-500">
                Target Role
              </label>
              <select
                className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                value={activeTab.targetRole}
                onChange={(e) =>
                  updateActiveTab({
                    targetRole: e.target.value as TargetRole,
                  })
                }
              >
                {roleOptions.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              <label className="text-xs font-medium text-slate-500">
                Job Description
              </label>
              <textarea
                className="mb-3 h-56 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Paste JD here"
                value={activeTab.jdText}
                onChange={(e) => updateActiveTab({ jdText: e.target.value })}
              />

              <label className="text-xs font-medium text-slate-500">
                Additional Instructions
              </label>
              <textarea
                className="mb-4 h-28 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Example: Make it more TPM-oriented, concise, and execution-focused."
                value={activeTab.additionalInstructions}
                onChange={(e) =>
                  updateActiveTab({
                    additionalInstructions: e.target.value,
                  })
                }
              />

              {error && (
                <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={generateResume}
                disabled={isGenerating}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>

            <OutputPanel
              output={activeTab.output}
              copyText={copyText}
              formatOutput={formatOutput}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function OutputPanel({
  output,
  copyText,
  formatOutput,
}: {
  output: GeneratedResumeOutput | null;
  copyText: (text: string) => void;
  formatOutput: (output: GeneratedResumeOutput) => string;
}) {
  if (!output) {
    return (
      <div className="rounded-xl bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Generated Output</h2>
        <p className="text-sm text-slate-500">
          Generate a resume version to see section-wise output here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Output</h2>
        <button
          onClick={() => copyText(formatOutput(output))}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
        >
          Copy Full Output
        </button>
      </div>

      <Section title="Profile" lines={output.profile} copyText={copyText} />

      <Section
        title="Experience"
        lines={output.experience.flatMap((exp) => [
          `${exp.company} — ${exp.title}`,
          `${exp.date_range}${exp.location ? ` | ${exp.location}` : ""}`,
          ...exp.bullets.map((bullet) => `• ${bullet}`),
          "",
        ])}
        copyText={copyText}
      />

      <Section
        title="Skills"
        lines={[
          `Tech & AI: ${output.skills.tech_and_ai.join(", ")}`,
          `Product: ${output.skills.product.join(", ")}`,
          `Data & Analytics: ${output.skills.data_and_analytics.join(", ")}`,
        ]}
        copyText={copyText}
      />

      <Section
        title="Education"
        lines={output.education.flatMap((edu) => [
          `${edu.institution} — ${edu.degree}`,
          `${edu.date_range}${edu.location ? ` | ${edu.location}` : ""}`,
          ...edu.details.map((detail) => `• ${detail}`),
          "",
        ])}
        copyText={copyText}
      />

      <Section
        title="Projects"
        lines={output.projects.flatMap((project) => [
          project.title,
          ...project.bullets.map((bullet) => `• ${bullet}`),
          "",
        ])}
        copyText={copyText}
      />

      <Section
        title="Publications"
        lines={output.publications}
        copyText={copyText}
      />

      <Section
        title="Languages"
        lines={output.languages}
        copyText={copyText}
      />
    </div>
  );
}

function Section({
  title,
  lines,
  copyText,
}: {
  title: string;
  lines: string[];
  copyText: (text: string) => void;
}) {
  const text = lines.filter(Boolean).join("\n");

  return (
    <section className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <button
          onClick={() => copyText(text)}
          className="rounded-lg bg-slate-100 px-3 py-1 text-xs"
        >
          Copy
        </button>
      </div>

      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {text}
      </div>
    </section>
  );
}