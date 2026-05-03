from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import MasterProfile, JDExtractResponse, GeneratedResumeOutput

llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0.3,
)

structured_llm = llm.with_structured_output(GeneratedResumeOutput)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert resume tailoring assistant.

Your task:
Rewrite and reorganize the user's resume content so it aligns with the selected target role and job description.

STRICT RULES:
- Do NOT invent achievements, metrics, tools, companies, titles, responsibilities, skills, publications, or projects.
- Use only information provided in the master profile.
- You may rewrite, reorder, shorten, and prioritize content.
- Keep bullets concise, professional, and resume-ready.
- Preserve factual accuracy.
- Keep the output close to the user's original resume style.
- Experience, education, projects, and publications may contain multiple entries.
- Keep company names, school names, project names, publication titles, job titles, and dates accurate.
- If a field such as location is missing, return an empty string.
- Return every required section.

SKILLS RULES:
- The master profile may contain many skill sections.
- Choose only the 3 most relevant skill sections for the target role and JD.
- The input skill sections may be named "Skill Section 1", "Skill Section 2", etc.
- Use the user's section names as hints, but improve the final section names to be resume-friendly and aligned to the JD.
- Example: "Skill Section 1" may become "Tech Stack & AI" if the skills are technical.
- Reorder skills inside each selected section based on relevance.
- Do NOT add skills that are not present in the master profile.

PUBLICATIONS RULES:
- Publications may have title and details.
- Preserve publication titles accurately.
- Do not invent conference names, publication names, or publication details.
            """,
        ),
        (
            "human",
            """
Target role:
{target_role}

Additional instructions:
{additional_instructions}

Structured JD analysis:
{jd_analysis}

Master profile:
{master_profile}
            """,
        ),
    ]
)


def generate_resume_chain(
    master_profile: MasterProfile,
    jd_analysis: JDExtractResponse,
    target_role: str,
    additional_instructions: str | None = None,
) -> GeneratedResumeOutput:
    chain = prompt | structured_llm

    return chain.invoke(
        {
            "target_role": target_role,
            "additional_instructions": additional_instructions or "",
            "jd_analysis": jd_analysis.model_dump_json(indent=2),
            "master_profile": master_profile.model_dump_json(indent=2),
        }
    )