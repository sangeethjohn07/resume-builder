from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import MasterProfile

llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0.2,
)

structured_llm = llm.with_structured_output(MasterProfile)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert resume parser.

Convert raw resume text into a structured JSON format.

RULES:
- Do NOT invent information
- Extract as much as possible
- If missing, return empty fields
- Skills should be grouped logically into sections
- Use "Skill Section 1, 2..." if unsure
            """,
        ),
        ("human", "{resume_text}"),
    ]
)


def parse_resume_chain(resume_text: str) -> MasterProfile:
    chain = prompt | structured_llm
    return chain.invoke({"resume_text": resume_text})