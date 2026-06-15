"""FastAPI Backend for AI-Based Text Analysis and Answer Evaluation System."""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os, tempfile, json, uvicorn
from evaluator import AnswerEvaluator
from text_extractor import extract_text, split_into_questions

app = FastAPI(title="AI Answer Evaluation System", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

evaluator = None

@app.on_event("startup")
async def startup():
    global evaluator
    evaluator = AnswerEvaluator()


class QuestionInput(BaseModel):
    question_number: int
    question_text: Optional[str] = ""
    answer_key: str
    student_answer: str
    max_marks: float

class ManualEvaluationRequest(BaseModel):
    questions: List[QuestionInput]
    evaluation_mode: str = "medium"


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "model_loaded": evaluator is not None}

@app.get("/api/model-status")
async def model_status():
    return {
        "loaded": evaluator is not None,
        "model_name": "all-MiniLM-L6-v2",
        "type": "Sentence Transformer (BERT-based)"
    }

@app.post("/api/evaluate/manual")
async def evaluate_manual(request: ManualEvaluationRequest):
    if evaluator is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    questions = [{
        "question_number": q.question_number,
        "question_text": q.question_text or f"Question {q.question_number}",
        "answer_key": q.answer_key,
        "student_answer": q.student_answer,
        "max_marks": q.max_marks,
    } for q in request.questions]
    return evaluator.evaluate_batch(questions, mode=request.evaluation_mode)

@app.post("/api/evaluate/file")
async def evaluate_file(
    answer_key_file: UploadFile = File(...),
    student_answer_file: UploadFile = File(...),
    question_paper_file: Optional[UploadFile] = File(None),
    evaluation_mode: str = Form("medium"),
    num_questions: int = Form(5),
    marks_distribution: str = Form("same"),
    same_marks: float = Form(10),
    question_marks: str = Form(""),
):
    if evaluator is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    temp_dir = tempfile.mkdtemp()
    try:
        key_path = os.path.join(temp_dir, f"key_{answer_key_file.filename}")
        with open(key_path, "wb") as f:
            f.write(await answer_key_file.read())
        student_path = os.path.join(temp_dir, f"student_{student_answer_file.filename}")
        with open(student_path, "wb") as f:
            f.write(await student_answer_file.read())

        try:
            key_text = extract_text(key_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Answer key extraction failed: {e}")
        try:
            student_text = extract_text(student_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Student answer extraction failed: {e}")

        key_answers = split_into_questions(key_text, num_questions)
        student_answers = split_into_questions(student_text, num_questions)

        actual_num = min(len(key_answers), len(student_answers), num_questions)
        if actual_num == 0:
            raise HTTPException(status_code=400, detail="Could not extract questions from files.")

        if marks_distribution == "different" and question_marks:
            try:
                marks_list = json.loads(question_marks)
            except:
                marks_list = [same_marks] * actual_num
        else:
            marks_list = [same_marks] * actual_num

        questions = []
        for i in range(actual_num):
            questions.append({
                "question_number": i + 1,
                "question_text": f"Question {i + 1}",
                "answer_key": key_answers[i],
                "student_answer": student_answers[i] if i < len(student_answers) else "",
                "max_marks": marks_list[i] if i < len(marks_list) else same_marks,
            })
        return evaluator.evaluate_batch(questions, mode=evaluation_mode)
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
