import {
  ApplicationTab,
  EducationItem,
  ExperienceItem,
  GeneratedResumeOutput,
  ProjectItem,
  PublicationItem,
  SkillSection,
} from "@/lib/types";

type SkillSectionsSource =
  | SkillSection[]
  | {
      tech_and_ai?: string[];
      product?: string[];
      data_and_analytics?: string[];
    }
  | null
  | undefined;

type PublicationSource = PublicationItem[] | string[] | null | undefined;

export function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export function commaToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToText(value: string[] | undefined): string {
  return value?.join("\n") ?? "";
}

export function listToComma(value: string[] | undefined): string {
  return value?.join(", ") ?? "";
}

export function createNewTab(index: number): ApplicationTab {
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

export function createExperience(): ExperienceItem {
  return {
    company: "",
    title: "",
    date_range: "",
    location: "",
    bullets: [],
    tags: [],
  };
}

export function createEducation(): EducationItem {
  return {
    institution: "",
    degree: "",
    date_range: "",
    location: "",
    details: [],
  };
}

export function createProject(): ProjectItem {
  return {
    title: "",
    bullets: [],
    tags: [],
  };
}

export function createSkillSection(index?: number): SkillSection {
  return {
    id: crypto.randomUUID(),
    name: `Skill Section ${index ?? ""}`.trim(),
    skills: [],
  };
}

export function createPublication(): PublicationItem {
  return {
    title: "",
    details: [],
  };
}

export function normalizeSkills(skills: SkillSectionsSource): SkillSection[] {
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

export function normalizePublications(
  publications: PublicationSource
): PublicationItem[] {
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

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatResumeOutput(output: GeneratedResumeOutput): string {
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
    ...skills.map((section) => `${section.name}: ${section.skills.join(", ")}`),
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
