# Resume Tailor AI

AI-powered resume optimization tool that transforms a base profile into role-specific, ATS-aligned resumes using job descriptions.

---

## Overview

Resume Tailor AI helps tailor resumes for different roles by:

* Taking a structured **master profile**
* Analyzing a **job description (JD)**
* Generating a **role-aligned resume**
* Evaluating alignment **before and after optimization**
* Highlighting important keywords and gaps

The system uses a multi-step AI pipeline built with **LangGraph**, enabling evaluation, improvement, and validation.

---

## Features

### Core

* Multi-tab workflow for handling multiple job applications
* Master profile as single source of truth
* JD input (paste or upload)
* AI-generated resume aligned to target role

### AI Capabilities

* JD analysis (keywords, responsibilities, skills)
* Resume generation
* Resume improvement loop
* Alignment scoring:

  * Master profile vs JD
  * Final resume vs JD

### Output Enhancements

* Keyword highlighting in generated resume
* Missing keyword detection
* Suggestions for improvement
* Section-wise resume preview

### UX

* Auto-save using localStorage
* Resume upload → auto-populate profile
* Clean structured editor for:

  * Experience
  * Education
  * Projects
  * Skills (multiple sections)
  * Publications
  * Languages

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

### Backend

* FastAPI (Python)
* LangChain
* LangGraph

### AI

* OpenAI API

### Desktop

* Electron (dev mode supported)

---

## Architecture

```text
Master Profile + JD
        ↓
   extract_jd
        ↓
evaluate_master_profile
        ↓
 generate_resume
        ↓
 improve_resume
        ↓
 evaluate_final
        ↓
      Output
```

Key concept:

* AI updates **state**
* LangGraph routes based on **state**

---

## Project Structure

```text
frontend/
  app/
    page.tsx
  lib/
    types.ts
    defaultState.ts

backend/
  app/
    main.py
    schemas.py
    graphs/
      resume_graph.py
    chains/
      jd_extractor.py
      resume_generator.py
      resume_improver.py
      resume_evaluator.py
      resume_evaluator_profile.py
    utils/
      file_parser.py
```

---

## Setup Instructions

### 1. Clone repo

```bash
git clone <repo-url>
cd resume-tailor-ai
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # mac/linux
venv\Scripts\activate      # windows

pip install -r requirements.txt
```

Create `.env`:

```env
OPENAI_API_KEY=your_key_here
```

Run backend:

```bash
uvicorn app.main:app --reload
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at:

```text
http://localhost:3000
```

---

### 4. Electron (optional dev mode)

```bash
npm run electron-dev
```

---

## How It Works

### 1. Master Profile

User inputs base resume data once.

### 2. JD Analysis

AI extracts:

* keywords
* required skills
* responsibilities

### 3. Generation

Resume is generated based on:

* master profile
* JD
* target role

### 4. Evaluation

Two scores:

* Before (master profile)
* After (generated resume)

### 5. Improvement

AI refines output using:

* evaluation feedback
* alignment gaps

---

## Guardrails

To prevent hallucinations:

* Strict prompt rules:
* no invention of tools, metrics, roles
* Structured outputs via schemas
* Evaluation-based improvement loop
* User-controlled final output

---

## Data Storage

* Uses `localStorage` for persistence
* Data stored per browser / Electron session


---

## Use Cases

* Applying to multiple roles (PM, TPM, Analyst, etc.)
* Resume optimization for ATS systems
* Iterative resume improvement
* Learning AI workflow orchestration (LangGraph)

---

## Author

Sangeeth John

---

## License

MIT License
