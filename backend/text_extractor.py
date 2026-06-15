"""Text extraction from PDF, images, and documents."""
import os
import re


def extract_text_from_pdf(file_path):
    try:
        import fitz
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        raise Exception(f"PDF extraction error: {str(e)}")


def extract_text_from_image(file_path):
    try:
        import pytesseract
        from PIL import Image
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"OCR failed: {str(e)}. Ensure Tesseract OCR is installed.")


def extract_text_from_docx(file_path):
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs]).strip()
    except Exception as e:
        raise Exception(f"DOCX extraction error: {str(e)}")


def extract_text_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read().strip()


def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif']:
        return extract_text_from_image(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    elif ext in ['.txt', '.text']:
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def split_into_questions(text, num_questions=None):
    patterns = [
        r'(?:Q(?:uestion)?\.?\s*(\d+)[\s.:)\-]+)',
        r'(?:Ans(?:wer)?\.?\s*(\d+)[\s.:)\-]+)',
        r'(?:^|\n)(\d+)[\s.:)\-]+',
    ]
    for pattern in patterns:
        splits = re.split(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
        if len(splits) > 2:
            answers = {}
            for i in range(1, len(splits), 2):
                try:
                    q_num = int(splits[i])
                    if i + 1 < len(splits):
                        ans = splits[i + 1].strip()
                        if ans:
                            answers[q_num] = ans
                except (ValueError, IndexError):
                    continue
            if answers:
                return [answers[k] for k in sorted(answers.keys())]
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if paragraphs:
        return paragraphs
    return [text.strip()] if text.strip() else []
