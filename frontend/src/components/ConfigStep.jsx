import { motion } from 'framer-motion';
import { FiSettings, FiHash, FiAward } from 'react-icons/fi';

const MODES = [
  { id: 'easy', label: 'Easy', desc: 'Lenient marking, higher scores', color: '#22c55e', icon: '🟢' },
  { id: 'medium', label: 'Medium', desc: 'Balanced & fair marking', color: '#f59e0b', icon: '🟡' },
  { id: 'tough', label: 'Tough', desc: 'Strict marking, lower scores', color: '#ef4444', icon: '🔴' },
  { id: 'lenient', label: 'Lenient', desc: 'Extra tolerance for partial answers', color: '#8b5cf6', icon: '🟣' },
];

export default function ConfigStep({ config, setConfig }) {
  const updateConfig = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleNumChange = (val) => {
    const n = Math.max(1, Math.min(50, parseInt(val) || 1));
    updateConfig('numQuestions', n);
    if (config.marksDistribution === 'different') {
      const marks = [...(config.questionMarks || [])];
      while (marks.length < n) marks.push(10);
      updateConfig('questionMarks', marks.slice(0, n));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold gradient-text font-[Outfit]">Configure Evaluation</h2>
        <p className="text-gray-400 mt-2">Set up your evaluation parameters</p>
      </div>

      {/* Number of Questions */}
      <div className="glass-card-gold p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <FiHash className="text-amber-400 text-lg" />
          </div>
          <h3 className="text-lg font-semibold">Number of Questions</h3>
        </div>
        <input type="number" min="1" max="50" value={config.numQuestions}
          onChange={e => handleNumChange(e.target.value)}
          className="input-dark w-32 text-center text-xl font-bold" />
      </div>

      {/* Marks Distribution */}
      <div className="glass-card-gold p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <FiAward className="text-amber-400 text-lg" />
          </div>
          <h3 className="text-lg font-semibold">Marks Distribution</h3>
        </div>
        <div className="flex gap-4 mb-4">
          {['same', 'different'].map(opt => (
            <button key={opt} onClick={() => {
              updateConfig('marksDistribution', opt);
              if (opt === 'different') {
                updateConfig('questionMarks', Array(config.numQuestions).fill(10));
              }
            }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                config.marksDistribution === opt
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-900'
                  : 'border border-white/10 text-gray-400 hover:border-amber-500/30'
              }`}>
              {opt === 'same' ? 'Same Marks for All' : 'Different Marks per Q'}
            </button>
          ))}
        </div>
        {config.marksDistribution === 'same' ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Marks per question:</span>
            <input type="number" min="1" max="100" value={config.sameMarks}
              onChange={e => updateConfig('sameMarks', Math.max(1, parseInt(e.target.value) || 1))}
              className="input-dark w-24 text-center font-bold" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: config.numQuestions }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">Q{i + 1}</span>
                <input type="number" min="1" max="100"
                  value={(config.questionMarks || [])[i] || 10}
                  onChange={e => {
                    const marks = [...(config.questionMarks || Array(config.numQuestions).fill(10))];
                    marks[i] = Math.max(1, parseInt(e.target.value) || 1);
                    updateConfig('questionMarks', marks);
                  }}
                  className="input-dark w-16 text-center text-sm font-bold" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Mode */}
      <div className="glass-card-gold p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <FiSettings className="text-amber-400 text-lg" />
          </div>
          <h3 className="text-lg font-semibold">Evaluation Mode</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MODES.map(mode => (
            <motion.button key={mode.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              onClick={() => updateConfig('evaluationMode', mode.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                config.evaluationMode === mode.id
                  ? 'border-2'
                  : 'border border-white/10 hover:border-white/20'
              }`}
              style={config.evaluationMode === mode.id ? {
                borderColor: mode.color,
                background: `${mode.color}15`,
                boxShadow: `0 0 20px ${mode.color}20`
              } : {}}>
              <div className="text-2xl mb-2">{mode.icon}</div>
              <div className="font-semibold" style={config.evaluationMode === mode.id ? { color: mode.color } : {}}>
                {mode.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{mode.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
