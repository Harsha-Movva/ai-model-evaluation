import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STEPS = [
  'Encoding answers with BERT embeddings...',
  'Computing semantic similarity vectors...',
  'Extracting and matching keywords...',
  'Analyzing concept coverage...',
  'Running neural network scoring layer...',
  'Calibrating accuracy scores...',
  'Generating detailed feedback...',
  'Finalizing evaluation results...',
];

export default function ProcessingStep() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20">
      {/* Neural Network Animation */}
      <div className="relative w-48 h-48 mb-10">
        {[0, 1, 2].map(ring => (
          <motion.div key={ring}
            className="absolute inset-0 rounded-full border-2 border-amber-500/30"
            style={{ inset: `${ring * 20}px` }}
            animate={{ rotate: ring % 2 === 0 ? 360 : -360, scale: [1, 1.1, 1] }}
            transition={{ duration: 3 + ring, repeat: Infinity, ease: 'linear' }} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl">🧠</motion.div>
        </div>
        {/* Floating nodes */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const r = 90;
          return (
            <motion.div key={i} className="absolute w-3 h-3 rounded-full bg-amber-400"
              style={{ left: `calc(50% + ${Math.cos(angle) * r}px - 6px)`, top: `calc(50% + ${Math.sin(angle) * r}px - 6px)` }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
          );
        })}
      </div>

      <motion.h3 className="text-2xl font-bold gradient-text mb-4 font-[Outfit]"
        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
        AI Processing in Progress
      </motion.h3>

      <motion.p key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }} className="text-gray-400 text-center">
        {STEPS[step]}
      </motion.p>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-dark-700 rounded-full mt-8 overflow-hidden">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    </motion.div>
  );
}
