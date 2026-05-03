from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import MasterProfile, JDExtractResponse, ResumeEvaluation

llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0.1,
)

structured_llm = llm.with_structured_output(ResumeEvaluation)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are evaluating how well a user's raw profile aligns with a job description.

This is NOT a resume. It is raw input.

Return:
- score (0–100)
- strengths
- missing_keywords
- weak_points
- improvement_suggestions

Be strict. This is baseline alignment.
            """,
        ),
        (
            "human",
            """
Target role:
{target_role}

JD analysis:
{jd_analysis}

Master profile:
{master_profile}
            """,
        ),
    ]
)


def evaluate_master_profile_chain(
    master_profile: MasterProfile,
    jd_analysis: JDExtractResponse,
    target_role: str,
):
    chain = prompt | structured_llm

    return chain.invoke(
        {
            "target_role": target_role,
            "jd_analysis": jd_analysis.model_dump_json(),
            "master_profile": master_profile.model_dump_json(),
        }
    )