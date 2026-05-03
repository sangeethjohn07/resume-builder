from app.schemas import MasterProfile, GeneratedResumeOutput


def generate_resume_chain(
    master_profile: MasterProfile,
    jd_text: str,
    target_role: str,
    additional_instructions: str | None = None,
) -> GeneratedResumeOutput:
    return GeneratedResumeOutput(
        profile=master_profile.profile_summary,
        experience=[],
        skills={
            "tech_and_ai": master_profile.skills.tech_and_ai,
            "product": master_profile.skills.product,
            "data_and_analytics": master_profile.skills.data_and_analytics,
        },
        education=master_profile.education,
        projects=master_profile.projects,
        publications=master_profile.publications,
        languages=master_profile.languages,
    )