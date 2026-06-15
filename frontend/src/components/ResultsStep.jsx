import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { FiAward, FiPercent, FiCheckCircle, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';

function getAccuracyColor(acc) {
  if (acc >= 80) return '#22c55e';
  if (acc >= 60) return '#f59e0b';
  if (acc >= 40) return '#f97316';
  return '#ef4444';
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-500 truncate">{label}</span>
      <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="w-10 text-right font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

function QuestionCard({ result, index }) {
  const color = getAccuracyColor(result.accuracy);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }} className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ background: `${color}20`, color }}>{result.question_number}</span>
          <div>
            <h4 className="font-semibold">Question {result.question_number}</h4>
            <p className="text-xs text-gray-500">{result.question_text}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>
            {result.marks_awarded}<span className="text-sm text-gray-500"> / {result.max_marks}</span>
          </div>
          <div className="text-xs" style={{ color }}>{result.accuracy}% accuracy</div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <ScoreBar label="Semantic" value={result.semantic_score} color="#8b5cf6" />
        <ScoreBar label="Keywords" value={result.keyword_score} color="#06b6d4" />
        <ScoreBar label="Concepts" value={result.concept_score} color="#f59e0b" />
      </div>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-dark-800/50">
        {result.accuracy >= 60 ? <FiCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" /> : <FiAlertCircle className="text-amber-400 mt-0.5 flex-shrink-0" />}
        <p className="text-xs text-gray-400 leading-relaxed">{result.feedback}</p>
      </div>
    </motion.div>
  );
}

export default function ResultsStep({ results, onReset }) {
  if (!results) return null;
  const { summary } = results;
  const color = getAccuracyColor(summary.overall_accuracy);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold gradient-text font-[Outfit]">Evaluation Results</h2>
        <p className="text-gray-400 mt-2">AI-powered analysis complete</p>
      </div>

      {/* Summary Card */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card-gold p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-40 h-40">
            <CircularProgressbar value={summary.overall_accuracy} text={`${summary.overall_accuracy}%`}
              styles={buildStyles({
                textSize: '18px', textColor: color, pathColor: color,
                trailColor: 'rgba(255,255,255,0.05)',
                pathTransitionDuration: 1.5,
              })} />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="glass-card p-4">
              <FiAward className="text-2xl text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{summary.total_marks}<span className="text-sm text-gray-500"> / {summary.max_total_marks}</span></div>
              <div className="text-xs text-gray-500 mt-1">Total Marks</div>
            </div>
            <div className="glass-card p-4">
              <FiPercent className="text-2xl text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold" style={{ color }}>{summary.overall_accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">Accuracy</div>
            </div>
            <div className="glass-card p-4">
              <FiBarChart2 className="text-2xl text-cyan-400 mx-auto mb-2" />
              <div className="text-3xl font-bold" style={{ color }}>{summary.grade}</div>
              <div className="text-xs text-gray-500 mt-1">Grade</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-2xl font-bold">{summary.total_questions}</div>
              <div className="text-xs text-gray-500 mt-1">Questions</div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-xs px-3 py-1 rounded-full bg-dark-800 text-gray-400 border border-white/5">
            Mode: <span className="text-amber-400 capitalize">{summary.evaluation_mode}</span>
          </span>
        </div>
      </motion.div>

      {/* Per-Question Results */}
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <FiBarChart2 className="text-amber-400" /> Question-wise Breakdown
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {results.results.map((r, i) => <QuestionCard key={r.question_number} result={r} index={i} />)}
      </div>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <button onClick={onReset} className="btn-gold text-lg px-10">
          🔄 Start New Evaluation
        </button>
      </div>
    </motion.div>
  );
}
