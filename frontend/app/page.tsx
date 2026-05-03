"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApplicationTab,
  EducationItem,
  ExperienceItem,
  GeneratedResumeOutput,
  MasterProfile,
  ProjectItem,
  PublicationItem,
  SkillSection,
  TargetRole,
  GenerateResumeResponse,
  ResumeEvaluation,
  JDAnalysis,
} from "@/lib/types";
import { defaultMasterProfile } from "@/lib/defaultState";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

function commaToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value: string[] | undefined): string {
  return value?.join("\n") ?? "";
}

function listToComma(value: string[] | undefined): string {
  return value?.join(", ") ?? "";
}

function createNewTab(index: number): ApplicationTab {
  return {
    id: crypto.randomUUID(),
    title: `Application ${index}`,
    targetRole: "TPM",
    jdText: "",
    additionalInstructions: "",
    output: null,
    master_evaluation: null,
    final_evaluation: null,
    jdAnalysis: null,
  };
}

function createExperience(): ExperienceItem {
  return {
    company: "",
    title: "",
    date_range: "",
    location: "",
    bullets: [],
    tags: [],
  };
}

function createEducation(): EducationItem {
  return {
    institution: "",
    degree: "",
    date_range: "",
    location: "",
    details: [],
  };
}

function createProject(): ProjectItem {
  return {
    title: "",
    bullets: [],
    tags: [],
  };
}

function createSkillSection(index?: number): SkillSection {
  return {
    id: crypto.randomUUID(),
    name: `Skill Section ${index ?? ""}`.trim(),
    skills: [],
  };
}

function createPublication(): PublicationItem {
  return {
    title: "",
    details: [],
  };
}

function normalizeSkills(skills: any): SkillSection[] {
  if (Array.isArray(skills)) return skills;

  return [
    {
      id: crypto.randomUUID(),
      name: "Skill Section 1",
      skills: skills?.tech_and_ai ?? [],
    },
    {
      id: crypto.randomUUID(),
      name: "Skill Section 2",
      skills: skills?.product ?? [],
    },
    {
      id: crypto.randomUUID(),
      name: "Skill Section 3",
      skills: skills?.data_and_analytics ?? [],
    },
  ];
}

function normalizePublications(publications: any): PublicationItem[] {
  if (!publications) return [];

  if (
    Array.isArray(publications) &&
    publications.every((item) => typeof item === "string")
  ) {
    return publications.map((title: string) => ({
      title,
      details: [],
    }));
  }

  return publications;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Home() {
  const [masterProfile, setMasterProfile] =
    useState<MasterProfile>(defaultMasterProfile);

  const [tabs, setTabs] = useState<ApplicationTab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const savedMasterProfile = localStorage.getItem(
      "resume-tailor-master-profile"
    );
    const savedTabs = localStorage.getItem("resume-tailor-tabs");
    const savedActiveTabId = localStorage.getItem(
      "resume-tailor-active-tab-id"
    );

    if (savedMasterProfile) {
      const parsed = JSON.parse(savedMasterProfile);
      parsed.skills = normalizeSkills(parsed.skills);
      parsed.publications = normalizePublications(parsed.publications);
      setMasterProfile(parsed);
    }

    if (savedTabs) {
      const parsedTabs: ApplicationTab[] = JSON.parse(savedTabs).map(
        (tab: ApplicationTab) => ({
          ...tab,
          output: tab.output
            ? {
                ...tab.output,
                skills: normalizeSkills(tab.output.skills),
                publications: normalizePublications(tab.output.publications),
              }
            : null,
          master_evaluation: tab.master_evaluation ?? null,
          final_evaluation: tab.final_evaluation ?? null,
          jdAnalysis: tab.jdAnalysis ?? null,
        })
      );

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

  function clearActiveTab() {
    updateActiveTab({
      jdText: "",
      additionalInstructions: "",
      output: null,
      master_evaluation: null,
      final_evaluation: null,
      jdAnalysis: null,
    });
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatusMessage("Parsing resume...");

      const response = await fetch(`${API_URL}/parse-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Resume parse failed: ${response.status}`);
      }

      const data: MasterProfile = await response.json();

      setMasterProfile({
        ...data,
        skills: normalizeSkills(data.skills),
        publications: normalizePublications(data.publications),
      });

      setStatusMessage("Resume imported successfully ✅");
      setIsDrawerOpen(true);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Failed to parse resume."
      );
    } finally {
      e.target.value = "";
    }
  }

  async function generateResume() {
    setStatusMessage("");

    if (!activeTab.jdText.trim()) {
      setStatusMessage("Please paste a JD before generating.");
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

      const data: GenerateResumeResponse = await response.json();

      updateActiveTab({
        output: {
          ...data.output,
          skills: normalizeSkills(data.output.skills),
          publications: normalizePublications(data.output.publications),
        },
        master_evaluation: data.master_evaluation,
        final_evaluation: data.final_evaluation,
        jdAnalysis: data.jd_analysis,
      });

      setStatusMessage("Generated successfully ✅");
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function formatOutput(output: GeneratedResumeOutput): string {
    const skills = normalizeSkills(output.skills);
    const publications = normalizePublications(output.publications);

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
      ...skills.map(
        (section) => `${section.name}: ${section.skills.join(", ")}`
      ),
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
      ...publications.flatMap((pub) => [
        pub.title,
        ...pub.details.map((detail) => `• ${detail}`),
        "",
      ]),
      "LANGUAGES",
      output.languages.join(" | "),
    ].join("\n");
  }

  if (!isLoaded || tabs.length === 0 || !activeTab) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
              ✦
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Resume Tailor AI
              </h1>
              <p className="text-sm text-slate-500">
                Tailor your resume. Land more interviews.
              </p>
            </div>
          </div>

          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            ● Auto-saved
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100vh-77px)] grid-cols-[280px_1fr_1.2fr] gap-4 p-4">
        <aside className="overflow-y-auto rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Master Profile
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Shared source content for all tabs.
              </p>
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3">
            <Summary
              label="Experience"
              count={masterProfile.experiences.length}
            />
            <Summary label="Skills" count={masterProfile.skills.length} />
            <Summary
              label="Education"
              count={masterProfile.education.length}
            />
            <Summary label="Projects" count={masterProfile.projects.length} />
            <Summary
              label="Publications"
              count={masterProfile.publications.length}
            />
            <Summary label="Languages" count={masterProfile.languages.length} />
          </div>

          <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
            <p className="font-semibold">Tip</p>
            <p className="mt-1 text-violet-800">
              Import an existing resume from the editor, then clean the
              extracted profile.
            </p>
          </div>
        </aside>

        <section className="overflow-y-auto rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  tab.id === activeTabId
                    ? "bg-violet-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                }`}
              >
                {tab.title}
              </button>
            ))}

            <button onClick={addTab} className="btn-primary-small">
              + New Tab
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Application Workspace
              </p>
              <h2 className="mt-1 text-xl font-bold">Job Details</h2>
            </div>

            <label className="label">Tab Name</label>
            <input
              className="input mb-3"
              value={activeTab.title}
              onChange={(e) => updateActiveTab({ title: e.target.value })}
            />

            <label className="label">Target Role</label>
            <select
              className="input mb-3"
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

            <label className="label">Job Description</label>
            <textarea
              className="textarea mb-2 h-72"
              placeholder="Paste JD here"
              value={activeTab.jdText}
              onChange={(e) => updateActiveTab({ jdText: e.target.value })}
            />

            <p className="mb-3 text-xs text-slate-500">
              {activeTab.jdText.length.toLocaleString()} characters
            </p>

            <label className="label">Additional Instructions</label>
            <textarea
              className="textarea mb-4 h-32"
              placeholder="Example: Make it more TPM-oriented, concise, and execution-focused."
              value={activeTab.additionalInstructions}
              onChange={(e) =>
                updateActiveTab({
                  additionalInstructions: e.target.value,
                })
              }
            />

            {statusMessage && (
              <p className="mb-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                {statusMessage}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={generateResume}
                disabled={isGenerating}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Tailored Resume"}
              </button>

              <button onClick={clearActiveTab} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>

          <GeneratedSectionsSummary output={activeTab.output} />
        </section>

        <OutputPanel
          output={activeTab.output}
          master_evaluation={activeTab.master_evaluation}
          final_evaluation={activeTab.final_evaluation}
          jdAnalysis={activeTab.jdAnalysis}
          copyText={copyText}
          formatOutput={formatOutput}
        />
      </div>

      {isDrawerOpen && (
        <MasterProfileDrawer
          masterProfile={masterProfile}
          setMasterProfile={setMasterProfile}
          onClose={() => setIsDrawerOpen(false)}
          handleResumeUpload={handleResumeUpload}
          statusMessage={statusMessage}
        />
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }

        .textarea {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          resize: vertical;
        }

        .textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }

        .label {
          margin-bottom: 0.25rem;
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
        }

        .btn-secondary {
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
        }

        .btn-secondary:hover {
          border-color: #8b5cf6;
          color: #6d28d9;
        }

        .btn-primary-small {
          border-radius: 0.75rem;
          background: #7c3aed;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .sub-card {
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 0.75rem;
        }
      `}</style>
    </main>
  );
}

function MasterProfileDrawer({
  masterProfile,
  setMasterProfile,
  onClose,
  handleResumeUpload,
  statusMessage,
}: {
  masterProfile: MasterProfile;
  setMasterProfile: React.Dispatch<React.SetStateAction<MasterProfile>>;
  onClose: () => void;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  statusMessage: string;
}) {
  function updateBasics(field: string, value: string) {
    setMasterProfile((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: value,
      },
    }));
  }

  function updateMasterProfile(value: Partial<MasterProfile>) {
    setMasterProfile((prev) => ({ ...prev, ...value }));
  }

  function updateExperience(index: number, value: Partial<ExperienceItem>) {
    setMasterProfile((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function addExperience() {
    setMasterProfile((prev) => ({
      ...prev,
      experiences: [...prev.experiences, createExperience()],
    }));
  }

  function removeExperience(index: number) {
    setMasterProfile((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  }

  function updateEducation(index: number, value: Partial<EducationItem>) {
    setMasterProfile((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function addEducation() {
    setMasterProfile((prev) => ({
      ...prev,
      education: [...prev.education, createEducation()],
    }));
  }

  function removeEducation(index: number) {
    setMasterProfile((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  }

  function updateProject(index: number, value: Partial<ProjectItem>) {
    setMasterProfile((prev) => ({
      ...prev,
      projects: prev.projects.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function addProject() {
    setMasterProfile((prev) => ({
      ...prev,
      projects: [...prev.projects, createProject()],
    }));
  }

  function removeProject(index: number) {
    setMasterProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  }

  function updateSkillSection(index: number, value: Partial<SkillSection>) {
    setMasterProfile((prev) => ({
      ...prev,
      skills: prev.skills.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function addSkillSection() {
    setMasterProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, createSkillSection(prev.skills.length + 1)],
    }));
  }

  function removeSkillSection(index: number) {
    setMasterProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  }

  function updatePublication(index: number, value: Partial<PublicationItem>) {
    setMasterProfile((prev) => ({
      ...prev,
      publications: prev.publications.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function addPublication() {
    setMasterProfile((prev) => ({
      ...prev,
      publications: [...prev.publications, createPublication()],
    }));
  }

  function removePublication(index: number) {
    setMasterProfile((prev) => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} />

      <div className="relative ml-auto h-full w-[760px] overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="sticky top-0 z-10 mb-5 flex items-center justify-between border-b bg-white pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Master Profile
            </p>
            <h2 className="text-2xl font-bold">Edit Source Content</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:border-violet-300 hover:text-violet-700"
          >
            Close
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Import Resume</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload a PDF or DOCX resume to auto-fill this master profile.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <label className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Upload Resume
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />
            </label>

            <span className="text-xs text-slate-400">PDF or DOCX</span>
          </div>

          {statusMessage && (
            <p className="mt-3 rounded-xl bg-white p-2 text-sm text-slate-700">
              {statusMessage}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Basics">
            <div className="grid grid-cols-2 gap-3">
              {["name", "email", "phone", "portfolio", "linkedin", "location"].map(
                (field) => (
                  <input
                    key={field}
                    className="input"
                    placeholder={field}
                    value={
                      masterProfile.basics[
                        field as keyof typeof masterProfile.basics
                      ] ?? ""
                    }
                    onChange={(e) => updateBasics(field, e.target.value)}
                  />
                )
              )}
            </div>
          </Card>

          <Card title="Profile Summary">
            <textarea
              className="textarea h-28"
              placeholder="One bullet per line"
              value={listToText(masterProfile.profile_summary)}
              onChange={(e) =>
                updateMasterProfile({
                  profile_summary: textToList(e.target.value),
                })
              }
            />
          </Card>

          <Card
            title="Experience"
            badge={masterProfile.experiences.length}
            action={
              <button className="btn-secondary" onClick={addExperience}>
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {masterProfile.experiences.map((exp, index) => (
                <div key={index} className="sub-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {exp.company || `Experience ${index + 1}`}
                    </p>
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => removeExperience(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(index, { company: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Title"
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(index, { title: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Date range"
                      value={exp.date_range}
                      onChange={(e) =>
                        updateExperience(index, { date_range: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Location"
                      value={exp.location ?? ""}
                      onChange={(e) =>
                        updateExperience(index, { location: e.target.value })
                      }
                    />
                  </div>

                  <textarea
                    className="textarea mt-2 h-32"
                    placeholder="Bullets, one per line"
                    value={listToText(exp.bullets)}
                    onChange={(e) =>
                      updateExperience(index, {
                        bullets: textToList(e.target.value),
                      })
                    }
                  />

                  <input
                    className="input mt-2"
                    placeholder="Tags comma separated"
                    value={listToComma(exp.tags)}
                    onChange={(e) =>
                      updateExperience(index, {
                        tags: commaToList(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Skills"
            badge={masterProfile.skills.length}
            action={
              <button className="btn-secondary" onClick={addSkillSection}>
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {masterProfile.skills.map((section, index) => (
                <div key={section.id ?? index} className="sub-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Skill Section {index + 1}
                    </p>
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => removeSkillSection(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    className="input mb-2"
                    placeholder="Section name hint, e.g. Tech Stack & AI"
                    value={section.name}
                    onChange={(e) =>
                      updateSkillSection(index, { name: e.target.value })
                    }
                  />

                  <textarea
                    className="textarea h-24"
                    placeholder="Comma separated skills, e.g. Python, SQL, Docker"
                    value={listToComma(section.skills)}
                    onChange={(e) =>
                      updateSkillSection(index, {
                        skills: commaToList(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Education"
            badge={masterProfile.education.length}
            action={
              <button className="btn-secondary" onClick={addEducation}>
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {masterProfile.education.map((edu, index) => (
                <div key={index} className="sub-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {edu.institution || `Education ${index + 1}`}
                    </p>
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => removeEducation(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(index, {
                          institution: e.target.value,
                        })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, { degree: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Date range"
                      value={edu.date_range}
                      onChange={(e) =>
                        updateEducation(index, {
                          date_range: e.target.value,
                        })
                      }
                    />
                    <input
                      className="input"
                      placeholder="Location"
                      value={edu.location ?? ""}
                      onChange={(e) =>
                        updateEducation(index, { location: e.target.value })
                      }
                    />
                  </div>

                  <textarea
                    className="textarea mt-2 h-28"
                    placeholder="Details, one per line"
                    value={listToText(edu.details)}
                    onChange={(e) =>
                      updateEducation(index, {
                        details: textToList(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Projects"
            badge={masterProfile.projects.length}
            action={
              <button className="btn-secondary" onClick={addProject}>
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {masterProfile.projects.map((project, index) => (
                <div key={index} className="sub-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {project.title || `Project ${index + 1}`}
                    </p>
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => removeProject(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    className="input mb-2"
                    placeholder="Project title"
                    value={project.title}
                    onChange={(e) =>
                      updateProject(index, { title: e.target.value })
                    }
                  />

                  <textarea
                    className="textarea h-28"
                    placeholder="Bullets, one per line"
                    value={listToText(project.bullets)}
                    onChange={(e) =>
                      updateProject(index, {
                        bullets: textToList(e.target.value),
                      })
                    }
                  />

                  <input
                    className="input mt-2"
                    placeholder="Tags comma separated"
                    value={listToComma(project.tags)}
                    onChange={(e) =>
                      updateProject(index, {
                        tags: commaToList(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Publications"
            badge={masterProfile.publications.length}
            action={
              <button className="btn-secondary" onClick={addPublication}>
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {masterProfile.publications.map((publication, index) => (
                <div key={index} className="sub-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {publication.title || `Publication ${index + 1}`}
                    </p>
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => removePublication(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    className="input mb-2"
                    placeholder="Publication title"
                    value={publication.title}
                    onChange={(e) =>
                      updatePublication(index, { title: e.target.value })
                    }
                  />

                  <textarea
                    className="textarea h-24"
                    placeholder="Details, one per line"
                    value={listToText(publication.details)}
                    onChange={(e) =>
                      updatePublication(index, {
                        details: textToList(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Languages">
            <textarea
              className="textarea h-20"
              placeholder="Example: English, French, Hindi, Malayalam"
              value={listToComma(masterProfile.languages)}
              onChange={(e) =>
                updateMasterProfile({
                  languages: commaToList(e.target.value),
                })
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {count}
      </span>
    </div>
  );
}

function Card({
  title,
  children,
  action,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  badge?: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          {typeof badge === "number" && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function GeneratedSectionsSummary({
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

function OutputPanel({
  output,
  jdAnalysis,
  copyText,
  formatOutput,
  master_evaluation,
  final_evaluation,
}: {
  output: GeneratedResumeOutput | null;
  master_evaluation?: ResumeEvaluation | null;
  final_evaluation?: ResumeEvaluation | null;
  jdAnalysis?: JDAnalysis | null;
  copyText: (text: string) => void;
  formatOutput: (output: GeneratedResumeOutput) => string;
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
          onClick={() => copyText(formatOutput(output))}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-violet-300 hover:text-violet-700"
        >
          Copy Full Resume
        </button>
      </div>

      {master_evaluation && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Alignment Score (for master profile)
              </p>
              <h3 className="text-2xl font-bold">{master_evaluation.score}/100</h3>
            </div>

            <div className="h-3 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{ width: `${Math.min(master_evaluation.score, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
            {final_evaluation && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Alignment Score (for final resume)
              </p>
              <h3 className="text-2xl font-bold">{final_evaluation.score}/100</h3>
            </div>

            <div className="h-3 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600"
                style={{ width: `${Math.min(final_evaluation.score, 100)}%` }}
              />
            </div>
          </div>


          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniList title="Strengths" items={final_evaluation.strengths} />
            <MiniList
              title="Missing Keywords"
              items={final_evaluation.missing_keywords}
            />
            <MiniList title="Weak Points" items={final_evaluation.weak_points} />
            <MiniList
              title="Suggestions"
              items={final_evaluation.improvement_suggestions}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Section
          title="Profile"
          lines={output.profile}
          copyText={copyText}
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
          copyText={copyText}
          keywords={highlightKeywords}
        />

        <Section
          title="Skills"
          lines={skills.map(
            (section) => `${section.name}: ${section.skills.join(", ")}`
          )}
          copyText={copyText}
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
          copyText={copyText}
          keywords={highlightKeywords}
        />

        <Section
          title="Projects"
          lines={output.projects.flatMap((project) => [
            project.title,
            ...project.bullets.map((bullet) => `• ${bullet}`),
            "",
          ])}
          copyText={copyText}
          keywords={highlightKeywords}
        />

        <Section
          title="Publications"
          lines={publications.flatMap((pub) => [
            pub.title,
            ...pub.details.map((detail) => `• ${detail}`),
            "",
          ])}
          copyText={copyText}
          keywords={highlightKeywords}
        />

        <Section
          title="Languages"
          lines={[output.languages.join(" | ")]}
          copyText={copyText}
          keywords={highlightKeywords}
        />
      </div>
    </section>
  );
}

function Section({
  title,
  lines,
  copyText,
  keywords = [],
}: {
  title: string;
  lines: string[];
  copyText: (text: string) => void;
  keywords?: string[];
}) {
  const text = lines.filter(Boolean).join("\n");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {title}
        </h3>
        <button
          onClick={() => copyText(text)}
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

