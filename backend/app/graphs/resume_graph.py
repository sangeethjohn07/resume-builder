from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.schemas import (
    MasterProfile,
    JDExtractResponse,
    GeneratedResumeOutput,
    ResumeEvaluation,
)
from app.chains.jd_extractor import extract_jd_chain
from app.chains.resume_generator import generate_resume_chain
from app.chains.resume_evaluator import evaluate_resume_chain
from app.chains.resume_improver import improve_resume_chain


class ResumeGraphState(TypedDict, total=False):
    master_profile: MasterProfile
    jd_text: str
    target_role: str
    additional_instructions: str

    jd_analysis: JDExtractResponse
    generated_output: GeneratedResumeOutput
    evaluation: ResumeEvaluation
    improved_output: GeneratedResumeOutput


def extract_jd_node(state: ResumeGraphState) -> ResumeGraphState:
    jd_analysis = extract_jd_chain(
        jd_text=state["jd_text"],
        target_role=state.get("target_role"),
        additional_instructions=state.get("additional_instructions"),
    )

    return {"jd_analysis": jd_analysis}


def generate_resume_node(state: ResumeGraphState) -> ResumeGraphState:
    generated_output = generate_resume_chain(
        master_profile=state["master_profile"],
        jd_analysis=state["jd_analysis"],
        target_role=state["target_role"],
        additional_instructions=state.get("additional_instructions"),
    )

    return {"generated_output": generated_output}


def evaluate_resume_node(state: ResumeGraphState) -> ResumeGraphState:
    evaluation = evaluate_resume_chain(
        target_role=state["target_role"],
        jd_analysis=state["jd_analysis"],
        generated_resume=state["generated_output"],
    )

    return {"evaluation": evaluation}


def improve_resume_node(state: ResumeGraphState) -> ResumeGraphState:
    improved_output = improve_resume_chain(
        master_profile=state["master_profile"],
        target_role=state["target_role"],
        additional_instructions=state.get("additional_instructions", ""),
        jd_analysis=state["jd_analysis"],
        generated_resume=state["generated_output"],
        evaluation=state["evaluation"],
    )

    return {"improved_output": improved_output}


def build_resume_graph():
    graph = StateGraph(ResumeGraphState)

    graph.add_node("extract_jd", extract_jd_node)
    graph.add_node("generate_resume", generate_resume_node)
    graph.add_node("evaluate_resume", evaluate_resume_node)
    graph.add_node("improve_resume", improve_resume_node)

    graph.set_entry_point("extract_jd")

    graph.add_edge("extract_jd", "generate_resume")
    graph.add_edge("generate_resume", "evaluate_resume")
    graph.add_edge("evaluate_resume", "improve_resume")
    graph.add_edge("improve_resume", END)

    return graph.compile()


resume_graph = build_resume_graph()