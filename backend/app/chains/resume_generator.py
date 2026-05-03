from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import (
    MasterProfile,
    JDExtractResponse,
    GeneratedResumeOutput,
)

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

Your task is to rewrite and reorganize the user's resume content so it aligns better with the selected target role and job description.

STRICT RULES:
- Do NOT invent achievements, metrics, tools, companies, titles, responsibilities, or projects.
- Use only the information provided in the master profile.
- You may rewrite, reorder, shorten, and prioritize content.
- Keep bullets concise, professional, and resume-ready.
- Preserve factual accuracy.
- Keep the output close to the user's original resume style.
- Skills can be reordered for relevance.
- Education, publications, and languages should usually remain mostly unchanged.
- If a field such as location is missing, return an empty string.
- Always return every required section.

Output sections required:
- profile
- experience
- skills
- education
- projects
- publications
- languages
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

    result = chain.invoke(
        {
            "target_role": target_role,
            "additional_instructions": additional_instructions or "",
            "jd_analysis": jd_analysis.model_dump_json(indent=2),
            "master_profile": master_profile.model_dump_json(indent=2),
        }
    )

    return result