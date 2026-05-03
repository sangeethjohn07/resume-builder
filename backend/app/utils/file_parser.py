from io import BytesIO
from pypdf import PdfReader
import docx


def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_file = BytesIO(file_bytes)
    reader = PdfReader(pdf_file)

    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    docx_file = BytesIO(file_bytes)
    document = docx.Document(docx_file)

    return "\n".join([paragraph.text for paragraph in document.paragraphs])


def extract_text(file_bytes: bytes, filename: str) -> str:
    filename = filename.lower()

    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)

    if filename.endswith(".docx"):
        return extract_text_from_docx(file_bytes)

    raise ValueError("Unsupported file format. Please upload a PDF or DOCX.")