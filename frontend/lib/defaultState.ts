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
  skills: {
    tech_and_ai: [],
    product: [],
    data_and_analytics: [],
  },
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