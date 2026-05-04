import type { Dispatch, SetStateAction } from "react";

import { Card } from "@/components/resume-tailor/shared";
import { MasterProfile } from "@/lib/types";
import {
  commaToList,
  createEducation,
  createExperience,
  createProject,
  createPublication,
  createSkillSection,
  listToComma,
  listToText,
  textToList,
} from "@/lib/resume-tailor-utils";

export function MasterProfileDrawer({
  masterProfile,
  setMasterProfile,
  onClose,
  handleResumeUpload,
  statusMessage,
}: {
  masterProfile: MasterProfile;
  setMasterProfile: Dispatch<SetStateAction<MasterProfile>>;
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

  function updateExperience(index: number, value: Partial<MasterProfile["experiences"][number]>) {
    setMasterProfile((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function updateEducation(index: number, value: Partial<MasterProfile["education"][number]>) {
    setMasterProfile((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function updateProject(index: number, value: Partial<MasterProfile["projects"][number]>) {
    setMasterProfile((prev) => ({
      ...prev,
      projects: prev.projects.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function updateSkillSection(index: number, value: Partial<MasterProfile["skills"][number]>) {
    setMasterProfile((prev) => ({
      ...prev,
      skills: prev.skills.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    }));
  }

  function updatePublication(index: number, value: Partial<MasterProfile["publications"][number]>) {
    setMasterProfile((prev) => ({
      ...prev,
      publications: prev.publications.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
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
              <button
                className="btn-secondary"
                onClick={() =>
                  setMasterProfile((prev) => ({
                    ...prev,
                    experiences: [...prev.experiences, createExperience()],
                  }))
                }
              >
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
                      onClick={() =>
                        setMasterProfile((prev) => ({
                          ...prev,
                          experiences: prev.experiences.filter((_, i) => i !== index),
                        }))
                      }
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
              <button
                className="btn-secondary"
                onClick={() =>
                  setMasterProfile((prev) => ({
                    ...prev,
                    skills: [...prev.skills, createSkillSection(prev.skills.length + 1)],
                  }))
                }
              >
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
                      onClick={() =>
                        setMasterProfile((prev) => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== index),
                        }))
                      }
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
              <button
                className="btn-secondary"
                onClick={() =>
                  setMasterProfile((prev) => ({
                    ...prev,
                    education: [...prev.education, createEducation()],
                  }))
                }
              >
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
                      onClick={() =>
                        setMasterProfile((prev) => ({
                          ...prev,
                          education: prev.education.filter((_, i) => i !== index),
                        }))
                      }
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
                        updateEducation(index, { institution: e.target.value })
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
                        updateEducation(index, { date_range: e.target.value })
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
              <button
                className="btn-secondary"
                onClick={() =>
                  setMasterProfile((prev) => ({
                    ...prev,
                    projects: [...prev.projects, createProject()],
                  }))
                }
              >
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
                      onClick={() =>
                        setMasterProfile((prev) => ({
                          ...prev,
                          projects: prev.projects.filter((_, i) => i !== index),
                        }))
                      }
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
              <button
                className="btn-secondary"
                onClick={() =>
                  setMasterProfile((prev) => ({
                    ...prev,
                    publications: [...prev.publications, createPublication()],
                  }))
                }
              >
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
                      onClick={() =>
                        setMasterProfile((prev) => ({
                          ...prev,
                          publications: prev.publications.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
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
