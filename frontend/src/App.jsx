import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FiCpu, FiZap, FiCheckCircle } from 'react-icons/fi';
import ConfigStep from './components/ConfigStep';
import InputStep from './components/InputStep';
import ProcessingStep from './components/ProcessingStep';
import ResultsStep from './components/ResultsStep';
import { evaluateManual, evaluateFile, checkHealth } from './api';

const STEPS = [
  { id: 0, label: 'Configure', icon: '⚙️' },
  { id: 1, label: 'Input', icon: '📝' },
  { id: 2, label: 'Processing', icon: '🧠' },
  { id: 3, label: 'Results', icon: '📊' },
];

export default function App() {
  const [step, setStep] = useState(0);
  const [backendReady, setBackendReady] = useState(false);
  const [config, setConfig] = useState({
    numQuestions: 5, marksDistribution: 'same', sameMarks: 10,
    questionMarks: [], evaluationMode: 'medium',
  });
  const [inputMode, setInputMode] = useState('manual');
  const [answerKeys, setAnswerKeys] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [files, setFiles] = useState({ answerKey: null, studentAnswer: null, questionPaper: null });
  const [results, setResults] = useState(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const h = await checkHealth();
        if (h.model_loaded) { setBackendReady(true); clearInterval(poll); }
      } catch { /* backend not up yet */ }
    }, 2000);
    checkHealth().then(h => { if (h.model_loaded) { setBackendReady(true); clearInterval(poll); } }).catch(() => {});
    return () => clearInterval(poll);
  }, []);

  const canProceedFromInput = () => {
    if (inputMode === 'manual') {
      for (let i = 0; i < config.numQuestions; i++) {
        if (!answerKeys[i]?.trim() || !studentAnswers[i]?.trim()) return false;
      }
      return true;
    }
    return files.answerKey && files.studentAnswer;
  };

  const handleEvaluate = async () => {
    if (!backendReady) { toast.error('AI model is still loading. Please wait...'); return; }
    setStep(2);
    try {
      let res;
      if (inputMode === 'manual') {
        const questions = Array.from({ length: config.numQuestions }, (_, i) => ({
          question_number: i + 1, question_text: `Question ${i + 1}`,
          answer_key: answerKeys[i] || '', student_answer: studentAnswers[i] || '',
          max_marks: config.marksDistribution === 'same' ? config.sameMarks : (config.questionMarks[i] || 10),
        }));
        res = await evaluateManual(questions, config.evaluationMode);
      } else {
        const fd = new FormData();
        fd.append('answer_key_file', files.answerKey);
        fd.append('student_answer_file', files.studentAnswer);
        if (files.questionPaper) fd.append('question_paper_file', files.questionPaper);
        fd.append('evaluation_mode', config.evaluationMode);
        fd.append('num_questions', config.numQuestions);
        fd.append('marks_distribution', config.marksDistribution);
        fd.append('same_marks', config.sameMarks);
        if (config.marksDistribution === 'different') {
          fd.append('question_marks', JSON.stringify(config.questionMarks));
        }
        res = await evaluateFile(fd);
      }
      setResults(res);
      setStep(3);
      toast.success('Evaluation complete!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Evaluation failed. Check backend.');
      setStep(1);
    }
  };

  const handleReset = () => {
    setStep(0);
    setResults(null);
    setAnswerKeys([]);
    setStudentAnswers([]);
    setFiles({ answerKey: null, studentAnswer: null, questionPaper: null });
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-grid relative">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e3a', color: '#e2e8f0', border: '1px solid rgba(245,158,11,0.2)' } }} />

      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-3xl">🧠</motion.div>
            <div>
              <h1 className="text-xl font-bold gradient-text font-[Outfit]">AI EvalPro</h1>
              <p className="text-xs text-gray-500">NLP-Powered Answer Evaluation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${backendReady ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-500">{backendReady ? 'AI Ready' : 'Loading model...'}</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-0 mb-12">
            {STEPS.filter(s => s.id < 3).map((s, i) => (
              <div key={s.id} className="flex items-center">
                <motion.div animate={step === s.id ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-500 ${
                    step === s.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-900 shadow-lg shadow-amber-500/20'
                    : step > s.id ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-dark-800 text-gray-500 border border-white/5'
                  }`}>
                  {step > s.id ? <FiCheckCircle /> : <span>{s.icon}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </motion.div>
                {i < 2 && <div className={`w-12 h-0.5 mx-1 transition-all duration-500 ${step > s.id ? 'bg-green-500/50' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <div key="config">
              <ConfigStep config={config} setConfig={setConfig} />
              <div className="flex justify-end mt-8">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(1)} className="btn-gold text-lg flex items-center gap-2">
                  Continue <FiZap />
                </motion.button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div key="input">
              <InputStep config={config} answerKeys={answerKeys} setAnswerKeys={setAnswerKeys}
                studentAnswers={studentAnswers} setStudentAnswers={setStudentAnswers}
                files={files} setFiles={setFiles} inputMode={inputMode} setInputMode={setInputMode} />
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(0)} className="btn-outline">← Back</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEvaluate} disabled={!canProceedFromInput() || !backendReady}
                  className="btn-gold text-lg flex items-center gap-2">
                  <FiCpu /> {backendReady ? 'Evaluate with AI' : 'Model loading...'}
                </motion.button>
              </div>
            </div>
          )}
          {step === 2 && <ProcessingStep key="processing" />}
          {step === 3 && <ResultsStep key="results" results={results} onReset={handleReset} />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-gray-600">AI EvalPro — Powered by Sentence Transformers (BERT) • Cosine Similarity • Neural Network Scoring</p>
        </div>
      </footer>
    </div>
  );
}
