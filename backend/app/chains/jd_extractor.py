from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import JDExtractResponse

llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0
)

structured_llm = llm.with_structured_output(JDExtractResponse)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are an expert job description analyzer.

Extract the following from the job description:
- role_title
- must_have_skills
- keywords
- responsibilities
- seniority
- domain

Rules:
- Return only information clearly supported by the JD
- Keep outputs concise
- Normalize wording where useful
- If something is unclear, leave it empty or null
        """
    ),
    (
        "human",
        """
Target role selected by user:
{target_role}

Additional instructions:
{additional_instructions}

Job description:
{jd_text}
        """
    )
])


def extract_jd_chain(
    jd_text: str,
    target_role: str | None = None,
    additional_instructions: str | None = None,
) -> JDExtractResponse:
    chain = prompt | structured_llm

    result = chain.invoke({
        "jd_text": jd_text,
        "target_role": target_role or "",
        "additional_instructions": additional_instructions or "",
    })

    return result