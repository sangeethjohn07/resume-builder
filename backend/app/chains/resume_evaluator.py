from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import JDExtractResponse, GeneratedResumeOutput, ResumeEvaluation

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
You are a resume quality evaluator.

Evaluate how well the generated resume aligns with the job description and target role.

Return:
- score from 0 to 100
- strengths
- missing_keywords
- weak_points
- improvement_suggestions

Rules:
- Be strict but fair
- Do not suggest fake experience
- Only suggest improvements that can be supported by the resume/profile content
            """,
        ),
        (
            "human",
            """
Target role:
{target_role}

JD analysis:
{jd_analysis}

Generated resume:
{generated_resume}
            """,
        ),
    ]
)


def evaluate_resume_chain(
    target_role: str,
    jd_analysis: JDExtractResponse,
    generated_resume: GeneratedResumeOutput,
) -> ResumeEvaluation:
    chain = prompt | structured_llm

    return chain.invoke(
        {
            "target_role": target_role,
            "jd_analysis": jd_analysis.model_dump_json(indent=2),
            "generated_resume": generated_resume.model_dump_json(indent=2),
        }
    )