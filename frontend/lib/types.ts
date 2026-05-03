export type TargetRole =
  | "PM"
  | "TPM"
  | "Product Analyst"
  | "Software Engineer"
  | "Automation Engineer"
  | "AI Engineer";

export type Basics = {
  name: string;
  email: string;
  phone: string;
  portfolio?: string;
  linkedin?: string;
  location?: string;
};

export type ExperienceItem = {
  company: string;
  title: string;
  date_range: string;
  location?: string;
  bullets: string[];
  tags: string[];
};

export type EducationItem = {
  institution: string;
  degree: string;
  date_range: string;
  location?: string;
  details: string[];
};

export type ProjectItem = {
  title: string;
  bullets: string[];
  tags: string[];
};

export type SkillGroups = {
  tech_and_ai: string[];
  product: string[];
  data_and_analytics: string[];
};

export type MasterProfile = {
  basics: Basics;
  profile_summary: string[];
  experiences: ExperienceItem[];
  skills: SkillGroups;
  education: EducationItem[];
  projects: ProjectItem[];
  publications: string[];
  languages: string[];
};

export type GeneratedResumeOutput = {
  profile: string[];
  experience: ExperienceItem[];
  skills: SkillGroups;
  education: EducationItem[];
  projects: ProjectItem[];
  publications: string[];
  languages: string[];
};

export type ApplicationTab = {
  id: string;
  title: string;
  targetRole: TargetRole;
  jdText: string;
  additionalInstructions: string;
  output: GeneratedResumeOutput | null;
};