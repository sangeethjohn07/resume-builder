"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { GeneratedSectionsSummary } from "@/components/resume-tailor/generated-sections-summary";
import { MasterProfileDrawer } from "@/components/resume-tailor/master-profile-drawer";
import { OutputPanel } from "@/components/resume-tailor/output-panel";
import { Summary } from "@/components/resume-tailor/shared";
import { defaultMasterProfile } from "@/lib/defaultState";
import {
  createNewTab,
  normalizePublications,
  normalizeSkills,
} from "@/lib/resume-tailor-utils";
import {
  ApplicationTab,
  GenerateResumeResponse,
  MasterProfile,
  TargetRole,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const roleOptions: TargetRole[] = [
  "PM",
  "TPM",
  "Product Analyst",
  "Software Engineer",
  "Automation Engineer",
  "AI Engineer",
];

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
    const timeout = window.setTimeout(() => {
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
    }, 0);

    return () => window.clearTimeout(timeout);
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

  async function handleResumeUpload(e: ChangeEvent<HTMLInputElement>) {
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

    if (!activeTab?.jdText.trim()) {
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
          masterEvaluation={activeTab.master_evaluation}
          finalEvaluation={activeTab.final_evaluation}
          jdAnalysis={activeTab.jdAnalysis}
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
    </main>
  );
}
