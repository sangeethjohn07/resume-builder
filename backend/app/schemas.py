from typing import List, Optional, Dict
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
    must_have_skills: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    seniority: Optional[str] = None
    domain: Optional[str] = None
    
class GenerateRequest(BaseModel):
    master_profile: MasterProfile
    jd_text: str
    target_role: str
    additional_instructions: Optional[str] = None
    

class GeneratedExperienceItem(BaseModel):
    company: str
    title: str
    date_range: str
    location: Optional[str] = None
    bullets: List[str] = Field(default_factory=list)
    
class GeneratedResumeOutput(BaseModel):
    profile: List[str] = Field(default_factory=list)
    experience: List[GeneratedExperienceItem] = Field(default_factory=list)
    skills: Dict[str, List[str]] = Field(default_factory=dict)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    publications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)