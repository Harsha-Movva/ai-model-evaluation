import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiEdit3, FiUpload, FiFile, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

function FileDropZone({ label, file, onDrop, onRemove }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files[0]),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png','.jpg','.jpeg'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  });
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-400 mb-2 block">{label}</label>
      {file ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <FiFile className="text-amber-400 text-xl flex-shrink-0" />
          <span className="text-amber-200 flex-1 truncate">{file.name}</span>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-400 transition cursor-pointer"><FiX /></button>
        </div>
      ) : (
        <div {...getRootProps()} className={`p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-amber-500/30'}`}>
          <input {...getInputProps()} />
          <FiUpload className="text-3xl text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Drop file or click to upload</p>
          <p className="text-gray-600 text-xs mt-1">PDF, Image, TXT, DOCX</p>
        </div>
      )}
    </div>
  );
}

function QuestionAccordion({ index, answerKey, studentAnswer, onKeyChange, onStudentChange }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div layout className="glass-card mb-3 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
            {index + 1}
          </span>
          <span className="font-medium">Question {index + 1}</span>
          {answerKey && studentAnswer && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">filled</span>
          )}
        </div>
        {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-amber-400 mb-1 block">Answer Key</label>
                <textarea value={answerKey} onChange={e => onKeyChange(e.target.value)}
                  placeholder="Enter the correct answer..."
                  className="textarea-dark text-sm" rows={3} />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400 mb-1 block">Student Answer</label>
                <textarea value={studentAnswer} onChange={e => onStudentChange(e.target.value)}
                  placeholder="Enter the student's answer..."
                  className="textarea-dark text-sm" rows={3} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InputStep({ config, answerKeys, setAnswerKeys, studentAnswers, setStudentAnswers, files, setFiles, inputMode, setInputMode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold gradient-text font-[Outfit]">Input Answers</h2>
        <p className="text-gray-400 mt-2">Choose your input method</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-dark-800 border border-white/5">
        {[{ id: 'manual', icon: FiEdit3, label: 'Manual Input' }, { id: 'file', icon: FiUpload, label: 'File Upload' }].map(tab => (
          <button key={tab.id} onClick={() => setInputMode(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
              inputMode === tab.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-900' : 'text-gray-400 hover:text-white'
            }`}>
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'manual' ? (
          <motion.div key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }} className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Enter answer key and student answers for each question</p>
              <span className="text-xs text-amber-400">{config.numQuestions} questions</span>
            </div>
            {Array.from({ length: config.numQuestions }, (_, i) => (
              <QuestionAccordion key={i} index={i}
                answerKey={answerKeys[i] || ''} studentAnswer={studentAnswers[i] || ''}
                onKeyChange={val => { const a = [...answerKeys]; a[i] = val; setAnswerKeys(a); }}
                onStudentChange={val => { const a = [...studentAnswers]; a[i] = val; setStudentAnswers(a); }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} className="glass-card-gold p-6 space-y-4">
            <FileDropZone label="📋 Answer Key File (Required)"
              file={files.answerKey} onDrop={f => setFiles(p => ({ ...p, answerKey: f }))}
              onRemove={() => setFiles(p => ({ ...p, answerKey: null }))} />
            <FileDropZone label="📝 Student Answer Script (Required)"
              file={files.studentAnswer} onDrop={f => setFiles(p => ({ ...p, studentAnswer: f }))}
              onRemove={() => setFiles(p => ({ ...p, studentAnswer: null }))} />
            <FileDropZone label="📄 Question Paper (Optional)"
              file={files.questionPaper} onDrop={f => setFiles(p => ({ ...p, questionPaper: f }))}
              onRemove={() => setFiles(p => ({ ...p, questionPaper: null }))} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
