from typing import List, Optional
from pydantic import BaseModel, Field


class Basics(BaseModel):
    name: str
    email: str
    phone: str
    portfolio: Optional[str] = None
    linkedin: Optional[str] = None
    location: Optional[str] = None


class ExperienceItem(BaseModel):
    company: str
    title: str
    date_range: str
    location: Optional[str] = None
    bullets: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    institution: str
    degree: str
    date_range: str
    location: Optional[str] = None
    details: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    title: str
    bullets: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class SkillGroups(BaseModel):
    tech_and_ai: List[str] = Field(default_factory=list)
    product: List[str] = Field(default_factory=list)
    data_and_analytics: List[str] = Field(default_factory=list)


class MasterProfile(BaseModel):
    basics: Basics
    profile_summary: List[str] = Field(default_factory=list)
    experiences: List[ExperienceItem] = Field(default_factory=list)
    skills: SkillGroups
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    publications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)


class JDExtractRequest(BaseModel):
    jd_text: str
    target_role: Optional[str] = None
    additional_instructions: Optional[str] = None


class JDExtractResponse(BaseModel):
    role_title: str
    must_have_skills: List[str]
    keywords: List[str]
    responsibilities: List[str]
    seniority: Optional[str] = None
    domain: Optional[str] = None


class GenerateRequest(BaseModel):
    master_profile: MasterProfile
    jd_text: str
    target_role: str
    additional_instructions: Optional[str] = None


# Separate strict output models for OpenAI structured output

class GeneratedExperienceItem(BaseModel):
    company: str
    title: str
    date_range: str
    location: str
    bullets: List[str]


class GeneratedEducationItem(BaseModel):
    institution: str
    degree: str
    date_range: str
    location: str
    details: List[str]


class GeneratedProjectItem(BaseModel):
    title: str
    bullets: List[str]
    tags: List[str]


class GeneratedSkillGroups(BaseModel):
    tech_and_ai: List[str]
    product: List[str]
    data_and_analytics: List[str]


class GeneratedResumeOutput(BaseModel):
    profile: List[str]
    experience: List[GeneratedExperienceItem]
    skills: GeneratedSkillGroups
    education: List[GeneratedEducationItem]
    projects: List[GeneratedProjectItem]
    publications: List[str]
    languages: List[str]