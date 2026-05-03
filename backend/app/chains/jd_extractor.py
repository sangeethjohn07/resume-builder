from app.schemas import JDExtractResponse


def extract_jd_chain(jd_text: str, target_role: str | None = None, additional_instructions: str | None = None) -> JDExtractResponse:
    return JDExtractResponse(
        role_title=target_role or "Unknown Role",
        must_have_skills=[],
        keywords=[],
        responsibilities=[],
        seniority=None,
        domain=None,
    )