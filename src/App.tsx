/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  BrainCircuit,
  Sparkles,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// --- Types ---

type Level = 'beginner' | 'intermediate' | 'expert';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface StudyPlan {
  explanation: string;
  analogy: string;
  quiz: QuizQuestion[];
  summary: string[];
}

// --- App Component ---

export default function App() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const generateStudyPlan = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setStudyPlan(null);
    setQuizAnswers({});
    setShowQuizResults(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the topic "${topic}" for a student at the ${level} level. 
        Provide a structured response in JSON format with the following fields:
        - explanation: A clear, simple explanation suitable for the level.
        - analogy: A real-world example or analogy to make it easier to understand.
        - quiz: An array of 3-5 multiple choice questions. Each question should have 'question', 'options' (array of 4 strings), 'correctAnswer' (string matching one of the options), and 'explanation'.
        - summary: An array of 3-5 key revision points.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              analogy: { type: Type.STRING },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctAnswer", "explanation"]
                }
              },
              summary: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["explanation", "analogy", "quiz", "summary"]
          }
        }
      });

      const result = await model;
      const responseText = result.text;
      if (responseText) {
        const data = JSON.parse(responseText) as StudyPlan;
        setStudyPlan(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (index: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const reset = () => {
    setTopic('');
    setStudyPlan(null);
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">StudyMentor</span>
          </div>
          {studyPlan && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={14} />
              New Topic
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!studyPlan ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider"
                >
                  <Sparkles size={12} />
                  AI-Powered Learning
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                  What do you want to <span className="text-indigo-600">master</span> today?
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Enter any topic, and I'll break it down, give you examples, and test your knowledge.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Topic or Subject</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Quantum Entanglement, French Revolution, Photosynthesis..."
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && generateStudyPlan()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Learning Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['beginner', 'intermediate', 'expert'] as Level[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`py-3 rounded-xl text-sm font-bold capitalize transition-all border-2 ${
                          level === l 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateStudyPlan}
                  disabled={loading || !topic.trim()}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Crafting your lesson...
                    </>
                  ) : (
                    <>
                      Start Learning
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-center font-medium">{error}</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="study-plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 pb-24"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
                <div className="space-y-1">
                  <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{level} Level</p>
                  <h2 className="text-4xl font-black text-gray-900">{topic}</h2>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                  <BookOpen size={16} />
                  <span>5 min read</span>
                </div>
              </div>

              {/* Explanation Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <BrainCircuit size={24} />
                  <h3 className="text-xl font-bold">The Breakdown</h3>
                </div>
                <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <Markdown>{studyPlan.explanation}</Markdown>
                </div>
              </section>

              {/* Analogy Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lightbulb size={24} />
                  <h3 className="text-xl font-bold">Real-world Analogy</h3>
                </div>
                <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 text-amber-900 italic text-lg leading-relaxed shadow-sm">
                  "{studyPlan.analogy}"
                </div>
              </section>

              {/* Summary Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={24} />
                  <h3 className="text-xl font-bold">Key Revision Points</h3>
                </div>
                <div className="grid gap-4">
                  {studyPlan.summary.map((point, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 font-medium">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Quiz Section */}
              <section className="space-y-6 pt-8 border-t border-gray-100">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black text-gray-900">Knowledge Check</h3>
                  <p className="text-gray-500">Test what you've just learned</p>
                </div>

                <div className="space-y-8">
                  {studyPlan.quiz.map((q, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <p className="text-xl font-bold text-gray-800">
                        <span className="text-indigo-600 mr-2">Q{i + 1}.</span>
                        {q.question}
                      </p>
                      <div className="grid gap-3">
                        {q.options.map((option) => {
                          const isSelected = quizAnswers[i] === option;
                          const isCorrect = option === q.correctAnswer;
                          const showResult = showQuizResults;

                          let buttonClass = "w-full p-4 rounded-xl text-left font-medium transition-all border-2 ";
                          if (showResult) {
                            if (isCorrect) buttonClass += "bg-emerald-50 border-emerald-500 text-emerald-700";
                            else if (isSelected) buttonClass += "bg-red-50 border-red-500 text-red-700";
                            else buttonClass += "bg-gray-50 border-gray-100 text-gray-400";
                          } else {
                            buttonClass += isSelected 
                              ? "bg-indigo-50 border-indigo-600 text-indigo-700" 
                              : "bg-gray-50 border-gray-50 text-gray-700 hover:border-indigo-200";
                          }

                          return (
                            <button
                              key={option}
                              disabled={showResult}
                              onClick={() => handleQuizAnswer(i, option)}
                              className={buttonClass}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {showResult && isCorrect && <CheckCircle2 size={18} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showQuizResults && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 bg-indigo-50 rounded-xl text-indigo-800 text-sm"
                        >
                          <p className="font-bold mb-1">Explanation:</p>
                          {q.explanation}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                {!showQuizResults ? (
                  <button
                    onClick={() => setShowQuizResults(true)}
                    disabled={Object.keys(quizAnswers).length < studyPlan.quiz.length}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
                  >
                    Check Answers
                  </button>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="p-8 bg-gray-900 text-white rounded-3xl space-y-2">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Your Score</p>
                      <p className="text-5xl font-black">
                        {Object.entries(quizAnswers).filter(([i, ans]) => ans === studyPlan.quiz[Number(i)].correctAnswer).length} / {studyPlan.quiz.length}
                      </p>
                    </div>
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                    >
                      Try another topic <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© 2026 AI Study Mentor • Built for curious minds</p>
      </footer>
    </div>
  );
}
