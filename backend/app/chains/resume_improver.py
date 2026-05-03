from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import (
    MasterProfile,
    JDExtractResponse,
    GeneratedResumeOutput,
    ResumeEvaluation,
)

llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0.25,
)

structured_llm = llm.with_structured_output(GeneratedResumeOutput)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert resume improvement assistant.

Your task:
Improve the generated resume using the evaluation feedback.

STRICT RULES:
- Do NOT invent achievements, metrics, tools, companies, responsibilities, skills, publications, or projects.
- Use only the master profile as factual source.
- Improve alignment with the JD and target role.
- Add missing keywords only if they are supported by the master profile.
- Keep bullets concise and resume-ready.
- Preserve factual accuracy.
- Return the full improved resume in the required structured format.
            """,
        ),
        (
            "human",
            """
Target role:
{target_role}

Additional instructions:
{additional_instructions}

JD analysis:
{jd_analysis}

Master profile:
{master_profile}

First generated resume:
{generated_resume}

            """,
        ),
    ]
)


def improve_resume_chain(
    master_profile: MasterProfile,
    target_role: str,
    additional_instructions: str,
    jd_analysis: JDExtractResponse,
    generated_resume: GeneratedResumeOutput,
) -> GeneratedResumeOutput:
    chain = prompt | structured_llm

    return chain.invoke(
        {
            "target_role": target_role,
            "additional_instructions": additional_instructions or "",
            "jd_analysis": jd_analysis.model_dump_json(indent=2),
            "master_profile": master_profile.model_dump_json(indent=2),
            "generated_resume": generated_resume.model_dump_json(indent=2),
        }
    )