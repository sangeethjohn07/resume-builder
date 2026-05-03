import { ApplicationTab, MasterProfile } from "./types";

export const defaultMasterProfile: MasterProfile = {
  basics: {
    name: "",
    email: "",
    phone: "",
    portfolio: "",
    linkedin: "",
    location: "",
  },
  profile_summary: [],
  experiences: [],
  skills: [
    {
      id: crypto.randomUUID(),
      name: "Skill Section 1",
      skills: [],
    },
    {
      id: crypto.randomUUID(),
      name: "Skill Section 2",
      skills: [],
    },
    {
      id: crypto.randomUUID(),
      name: "Skill Section 3",
      skills: [],
    },
  ],
  education: [],
  projects: [],
  publications: [],
  languages: [],
};

export const defaultTabs: ApplicationTab[] = [
  {
    id: crypto.randomUUID(),
    title: "Application 1",
    targetRole: "TPM",
    jdText: "",
    additionalInstructions: "",
    output: null,
  },
];