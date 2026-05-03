from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    JDExtractRequest,
    JDExtractResponse,
    GenerateRequest,
    GeneratedResumeOutput,
)
from app.chains.jd_extractor import extract_jd_chain
from app.graphs.resume_graph import resume_graph

from fastapi import UploadFile, File
from app.utils.file_parser import extract_text
from app.chains.resume_parser import parse_resume_chain

app = FastAPI(title="Resume Tailor AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Resume Tailor AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/extract-jd", response_model=JDExtractResponse)
def extract_jd(request: JDExtractRequest):
    return extract_jd_chain(
        jd_text=request.jd_text,
        target_role=request.target_role,
        additional_instructions=request.additional_instructions,
    )


@app.post("/generate", response_model=GeneratedResumeOutput)
def generate_resume(request: GenerateRequest):
    result = resume_graph.invoke(
        {
            "master_profile": request.master_profile,
            "jd_text": request.jd_text,
            "target_role": request.target_role,
            "additional_instructions": request.additional_instructions or "",
        }
    )
    return result["generated_output"]

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    content = await file.read()

    text = extract_text(content, file.filename)

    parsed = parse_resume_chain(text)

    return parsed