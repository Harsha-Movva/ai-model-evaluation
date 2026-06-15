"""
AI-Based Answer Evaluation Engine
Uses Sentence Transformers (BERT), Cosine Similarity, Keyword Matching,
Concept Coverage, and a Feedforward Neural Network Scoring Layer.
"""

import os
# Set huggingface cache to the local .hf_cache directory in the project folder
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cache_dir = os.path.join(base_dir, ".hf_cache")
os.environ["HF_HOME"] = cache_dir
os.environ["TRANSFORMERS_CACHE"] = cache_dir

import numpy as np
import re
import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine_similarity

# ============================================================
# Evaluation Mode Configurations
# ============================================================
MODE_CONFIGS = {
    'easy': {
        'semantic_weight': 0.45, 'keyword_weight': 0.15,
        'concept_weight': 0.20, 'length_weight': 0.10, 'nn_weight': 0.10,
        'bonus': 8, 'partial_credit_factor': 1.3, 'similarity_threshold': 0.35,
    },
    'medium': {
        'semantic_weight': 0.40, 'keyword_weight': 0.20,
        'concept_weight': 0.20, 'length_weight': 0.05, 'nn_weight': 0.15,
        'bonus': 0, 'partial_credit_factor': 1.0, 'similarity_threshold': 0.45,
    },
    'tough': {
        'semantic_weight': 0.30, 'keyword_weight': 0.25,
        'concept_weight': 0.25, 'length_weight': 0.05, 'nn_weight': 0.15,
        'bonus': -5, 'partial_credit_factor': 0.8, 'similarity_threshold': 0.55,
    },
    'lenient': {
        'semantic_weight': 0.50, 'keyword_weight': 0.10,
        'concept_weight': 0.15, 'length_weight': 0.10, 'nn_weight': 0.15,
        'bonus': 12, 'partial_credit_factor': 1.5, 'similarity_threshold': 0.30,
    }
}

STOPWORDS = set([
    'i','me','my','myself','we','our','ours','ourselves','you','your','yours',
    'yourself','yourselves','he','him','his','himself','she','her','hers','herself',
    'it','its','itself','they','them','their','theirs','themselves','what','which',
    'who','whom','this','that','these','those','am','is','are','was','were','be',
    'been','being','have','has','had','having','do','does','did','doing','a','an',
    'the','and','but','if','or','because','as','until','while','of','at','by',
    'for','with','about','against','between','through','during','before','after',
    'above','below','to','from','up','down','in','out','on','off','over','under',
    'again','further','then','once','here','there','when','where','why','how',
    'all','both','each','few','more','most','other','some','such','no','nor','not',
    'only','own','same','so','than','too','very','s','t','can','will','just','don',
    'should','now','also','could','would','may','might','shall','must','need',
    'used','using','use','uses',
])


# ============================================================
# Feedforward Neural Network Scoring Layer
# ============================================================
class ScoringNetwork(nn.Module):
    """Feedforward Neural Network for calibrating answer scores."""
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(4, 32), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(32, 16), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(16, 8), nn.ReLU(),
            nn.Linear(8, 1), nn.Sigmoid()
        )

    def forward(self, x):
        return self.network(x) * 100

    def predict(self, features):
        self.eval()
        with torch.no_grad():
            x = torch.FloatTensor(features).unsqueeze(0)
            return self.forward(x).item()


def _generate_training_data(n_samples=500):
    """Generate synthetic training data for the scoring network."""
    np.random.seed(42)
    patterns = [
        ([0.95,0.95,0.95,0.95], 97), ([0.90,0.90,0.90,0.90], 92),
        ([0.85,0.85,0.85,0.85], 87), ([0.80,0.75,0.80,0.80], 78),
        ([0.75,0.70,0.75,0.75], 73), ([0.70,0.65,0.70,0.70], 68),
        ([0.60,0.55,0.60,0.60], 55), ([0.50,0.45,0.50,0.50], 45),
        ([0.40,0.35,0.40,0.40], 35), ([0.30,0.25,0.30,0.30], 25),
        ([0.20,0.15,0.20,0.20], 15), ([0.10,0.10,0.10,0.10], 5),
        ([0.85,0.30,0.70,0.80], 68), ([0.80,0.25,0.60,0.75], 60),
        ([0.30,0.85,0.40,0.90], 42), ([0.25,0.80,0.35,0.85], 38),
        ([0.50,0.60,0.80,0.70], 58), ([0.70,0.50,0.40,0.20], 38),
        ([0.80,0.70,0.50,0.30], 50), ([0.05,0.05,0.05,0.05], 2),
        ([0.00,0.00,0.00,0.00], 0),
    ]
    X, y = [], []
    for features, target in patterns:
        for _ in range(n_samples // len(patterns)):
            noise = np.random.normal(0, 0.05, 4)
            noisy_f = np.clip(np.array(features) + noise, 0, 1).tolist()
            noisy_t = max(0, min(100, target + np.random.normal(0, 3)))
            X.append(noisy_f)
            y.append(noisy_t)
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


# ============================================================
# Main Evaluator Class
# ============================================================
class AnswerEvaluator:
    """
    Combines: Semantic Similarity (BERT), Keyword Matching,
    Concept Coverage, and Neural Network Scoring.
    """
    def __init__(self):
        print("[1/3] Loading Sentence Transformer model (all-MiniLM-L6-v2)... This may take a minute or two to download on the very first run!", flush=True)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("[2/3] Model loaded! Training scoring neural network...", flush=True)
        self.scoring_network = ScoringNetwork()
        self._train_scoring_network()
        print("[3/3] System ready!", flush=True)

    def _train_scoring_network(self, epochs=100, lr=0.001):
        X, y = _generate_training_data()
        X_t, y_t = torch.FloatTensor(X), torch.FloatTensor(y).unsqueeze(1)
        optimizer = torch.optim.Adam(self.scoring_network.parameters(), lr=lr)
        criterion = nn.MSELoss()
        self.scoring_network.train()
        for _ in range(epochs):
            optimizer.zero_grad()
            loss = criterion(self.scoring_network(X_t), y_t)
            loss.backward()
            optimizer.step()
        self.scoring_network.eval()
        print(f"   Scoring network trained. Final loss: {loss.item():.4f}")

    def _extract_keywords(self, text):
        words = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
        return set(w for w in words if w not in STOPWORDS)

    def _semantic_similarity(self, text1, text2):
        if not text1.strip() or not text2.strip():
            return 0.0
        emb = self.model.encode([text1, text2])
        sim = sklearn_cosine_similarity([emb[0]], [emb[1]])[0][0]
        return float(max(0, sim))

    def _keyword_similarity(self, answer_key, student_answer):
        kk = self._extract_keywords(answer_key)
        sk = self._extract_keywords(student_answer)
        if not kk:
            return 1.0 if not sk else 0.5
        return len(kk & sk) / len(kk)

    def _concept_coverage(self, answer_key, student_answer):
        ks = self._split_sentences(answer_key)
        ss = self._split_sentences(student_answer)
        if not ks: return 1.0
        if not ss: return 0.0
        ke = self.model.encode(ks)
        se = self.model.encode(ss)
        sim_matrix = sklearn_cosine_similarity(ke, se)
        covered = 0
        for i in range(len(ks)):
            ms = float(np.max(sim_matrix[i]))
            covered += ms if ms >= 0.4 else ms * 0.3
        return float(min(1.0, covered / len(ks)))

    def _split_sentences(self, text):
        sents = re.split(r'[.!?]+', text)
        sents = [s.strip() for s in sents if len(s.strip()) > 10]
        return sents if sents else ([text.strip()] if text.strip() else [])

    def _length_ratio(self, answer_key, student_answer):
        kl = max(len(answer_key.split()), 1)
        sl = len(student_answer.split())
        ratio = sl / kl
        return max(0, 1.0 - (ratio - 1.5) * 0.3) if ratio > 1.5 else min(1.0, ratio)

    def _generate_feedback(self, semantic, keyword, concept, accuracy):
        parts = []
        if accuracy >= 90: parts.append("Excellent answer! Comprehensive and accurate.")
        elif accuracy >= 75: parts.append("Good answer with strong understanding.")
        elif accuracy >= 60: parts.append("Decent answer but could be improved.")
        elif accuracy >= 40: parts.append("Partially correct. Needs more detail.")
        elif accuracy >= 20: parts.append("Weak answer. Missing key concepts.")
        else: parts.append("Very poor answer. Needs significant improvement.")
        if semantic >= 0.8: parts.append("Strong semantic understanding.")
        elif semantic < 0.4: parts.append("Meaning doesn't match expected answer.")
        if keyword < 0.4: parts.append("Missing important keywords.")
        elif keyword >= 0.8: parts.append("Good use of terminology.")
        if concept < 0.5: parts.append("Key concepts not covered.")
        elif concept >= 0.8: parts.append("Good concept coverage.")
        return " ".join(parts)

    def _get_grade(self, acc):
        if acc >= 95: return 'A+'
        if acc >= 90: return 'A'
        if acc >= 85: return 'A-'
        if acc >= 80: return 'B+'
        if acc >= 75: return 'B'
        if acc >= 70: return 'B-'
        if acc >= 65: return 'C+'
        if acc >= 60: return 'C'
        if acc >= 55: return 'C-'
        if acc >= 50: return 'D+'
        if acc >= 45: return 'D'
        if acc >= 40: return 'D-'
        return 'F'

    def evaluate_single(self, answer_key, student_answer, mode='medium', max_marks=10):
        if not student_answer or not student_answer.strip():
            return {'accuracy':0,'marks_awarded':0,'max_marks':max_marks,
                    'semantic_score':0,'keyword_score':0,'concept_score':0,
                    'nn_score':0,'feedback':"No answer provided."}
        if not answer_key or not answer_key.strip():
            return {'accuracy':0,'marks_awarded':0,'max_marks':max_marks,
                    'semantic_score':0,'keyword_score':0,'concept_score':0,
                    'nn_score':0,'feedback':"No answer key provided."}
        cfg = MODE_CONFIGS.get(mode, MODE_CONFIGS['medium'])
        sem = self._semantic_similarity(answer_key, student_answer)
        kw = self._keyword_similarity(answer_key, student_answer)
        con = self._concept_coverage(answer_key, student_answer)
        lr = self._length_ratio(answer_key, student_answer)
        nn_s = self.scoring_network.predict([sem, kw, con, lr])
        ws = (cfg['semantic_weight']*sem*100 + cfg['keyword_weight']*kw*100 +
              cfg['concept_weight']*con*100 + cfg['length_weight']*lr*100 +
              cfg['nn_weight']*nn_s)
        accuracy = max(0, min(100, ws * cfg['partial_credit_factor'] + cfg['bonus']))
        marks = round((accuracy / 100) * max_marks * 4) / 4
        return {
            'accuracy': round(accuracy, 1),
            'marks_awarded': marks,
            'max_marks': max_marks,
            'semantic_score': round(sem * 100, 1),
            'keyword_score': round(kw * 100, 1),
            'concept_score': round(con * 100, 1),
            'nn_score': round(nn_s, 1),
            'feedback': self._generate_feedback(sem, kw, con, accuracy)
        }

    def evaluate_batch(self, questions, mode='medium'):
        results = []
        for q in questions:
            r = self.evaluate_single(q['answer_key'], q['student_answer'],
                                     mode, q.get('max_marks', 10))
            r['question_number'] = q.get('question_number', len(results)+1)
            r['question_text'] = q.get('question_text', f"Question {r['question_number']}")
            results.append(r)
        total = sum(r['marks_awarded'] for r in results)
        max_t = sum(r['max_marks'] for r in results)
        oa = (total / max_t * 100) if max_t > 0 else 0
        return {
            'results': results,
            'summary': {
                'total_marks': round(total, 2), 'max_total_marks': max_t,
                'overall_accuracy': round(oa, 1), 'grade': self._get_grade(oa),
                'evaluation_mode': mode, 'total_questions': len(results)
            }
        }
