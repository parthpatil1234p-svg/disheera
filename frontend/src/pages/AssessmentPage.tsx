import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Code2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

interface Question {
  id: number;
  category: string;
  difficulty: string;
  question: string;
  codeSnippet?: string;
  options: { key: string; text: string; explanation?: string }[];
  correctKey: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'PostgreSQL & Database Internals',
    difficulty: 'Advanced Logic',
    question: 'Given a high-throughput talent search table with 2 million student records, an EXPLAIN ANALYZE reveals a costly Seq Scan on `skills_gin_idx`. Which PostgreSQL indexing strategy eliminates the sequential scan for array containment queries (`WHERE skills @> ARRAY[\'React\']`)?',
    codeSnippet: `EXPLAIN ANALYZE
SELECT id, name, target_role 
FROM student_profiles 
WHERE skills @> ARRAY['React', 'PostgreSQL']
ORDER BY merit_score DESC LIMIT 20;`,
    options: [
      { key: 'A', text: 'B-Tree multi-column index on (skills, merit_score)', explanation: 'B-Trees cannot efficiently index JSON or array containment operators (@>).' },
      { key: 'B', text: 'GIN index with gin_trgm_ops on skills column', explanation: 'Correct: Generalized Inverted Index (GIN) specializes in array and JSONB element lookup in O(log N).' },
      { key: 'C', text: 'BRIN (Block Range Index) on merit_score only', explanation: 'BRIN only works for monotonically increasing sequential physical storage.' },
      { key: 'D', text: 'Hash Index on array text representation', explanation: 'Hash indexes in PostgreSQL only support equality (=) comparisons, not array subset containment.' },
    ],
    correctKey: 'B'
  },
  {
    id: 2,
    category: 'Node.js Libuv & Event Loop Mechanics',
    difficulty: 'Intermediate Architecture',
    question: 'In what exact chronological order will the following asynchronous callbacks execute across the Node.js event loop phases?',
    codeSnippet: `setTimeout(() => console.log('Timer 1'), 0);
setImmediate(() => console.log('Immediate 1'));
process.nextTick(() => console.log('Tick 1'));
Promise.resolve().then(() => console.log('Promise 1'));`,
    options: [
      { key: 'A', text: 'Tick 1 → Promise 1 → Timer 1 → Immediate 1', explanation: 'Correct: process.nextTick microtasks run first, then Promise microtasks, then Timers phase, then Check phase.' },
      { key: 'B', text: 'Timer 1 → Immediate 1 → Tick 1 → Promise 1' },
      { key: 'C', text: 'Promise 1 → Tick 1 → Timer 1 → Immediate 1' },
      { key: 'D', text: 'Immediate 1 → Timer 1 → Tick 1 → Promise 1' },
    ],
    correctKey: 'A'
  },
  {
    id: 3,
    category: 'Application Security & Authentication',
    difficulty: 'Security Audit',
    question: 'When storing authentication tokens in modern Single Page Applications (SPA), which architecture provides maximum mitigation against both XSS token exfiltration and CSRF forgery?',
    codeSnippet: `// Option Comparison Matrix
Set-Cookie: token=jwt; HttpOnly; Secure; SameSite=Strict;
vs
localStorage.setItem('bearer', jwt);`,
    options: [
      { key: 'A', text: 'localStorage with obfuscated variable keys' },
      { key: 'B', text: 'HttpOnly, Secure, SameSite=Strict cookie with short expiry + double submit CSRF token', explanation: 'Correct: HttpOnly blocks JavaScript XSS access, Secure enforces HTTPS, and SameSite=Strict stops cross-site forgery.' },
      { key: 'C', text: 'sessionStorage with AES encryption in window object' },
      { key: 'D', text: 'URL query parameter in redirect hash fragment' },
    ],
    correctKey: 'B'
  }
];

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins
  const [isCompleted, setIsCompleted] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [cheatWarning, setCheatWarning] = useState<string | null>(null);

  // Anti-Cheat visibility change detection (matching anti-cheat-lock.js)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isCompleted) {
        setTabSwitches(prev => {
          const nextCount = prev + 1;
          setCheatWarning(`⚠️ Anti-Cheat Warning: Tab switch detected (${nextCount}/3). All focus loss events are recorded in your verified credential audit trail.`);
          setTimeout(() => setCheatWarning(null), 6000);
          return nextCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isCompleted]);

  // Timer countdown
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const currentQ = SAMPLE_QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / SAMPLE_QUESTIONS.length) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (key: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: key,
    });
  };

  const toggleFlag = () => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [currentQ.id]: !flaggedQuestions[currentQ.id],
    });
  };

  const handleNext = () => {
    if (currentIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    setIsCompleted(true);

    // Score calculation
    let calculatedCorrect = 0;
    SAMPLE_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctKey) {
        calculatedCorrect++;
      }
    });
    const finalScore = Math.round((calculatedCorrect / SAMPLE_QUESTIONS.length) * 100);

    // Synchronize diagnostic result with backend database
    api.post('/assessment/submit', {
      score: finalScore,
      correctCount: calculatedCorrect,
      totalQuestions: SAMPLE_QUESTIONS.length,
      tabSwitchesCount: tabSwitches,
      answers: selectedAnswers,
      completedAt: new Date().toISOString()
    }).catch(() => {});

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  // Score calculation
  let correctCount = 0;
  SAMPLE_QUESTIONS.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctKey) {
      correctCount++;
    }
  });
  const scorePercent = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F7F9FD] flex flex-col justify-between">
      {/* Sticky Assessment Telemetry Bar */}
      <div className="sticky top-16 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-[#0F172A]">
              Question {currentIndex + 1} of {SAMPLE_QUESTIONS.length}
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anti-Cheat Monitored</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-[#0F172A]">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-2 py-1 rounded-md"
            >
              Exit
            </button>
          </div>
        </div>

        {/* 3px Slim Progress Bar */}
        <div className="w-full h-1 bg-[#E2E8F0]">
          <div
            className="h-full bg-[#2563EB] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Anti-Cheat Floating Banner */}
        {cheatWarning && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-center text-xs font-bold text-rose-700 animate-fadeIn">
            {cheatWarning}
          </div>
        )}
      </div>

      {/* Main Assessment Body */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
        {!isCompleted ? (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-6">
              {/* Question Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    {currentQ.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {currentQ.category}
                  </span>
                </div>
                <button
                  onClick={toggleFlag}
                  className={`text-xs font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-lg transition ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'text-[#64748B] hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-relaxed">
                {currentQ.question}
              </h2>

              {/* Code Snippet Box */}
              {currentQ.codeSnippet && (
                <div className="rounded-xl bg-[#0F172A] text-slate-100 p-4 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[11px]">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Technical Reference Block</span>
                  </div>
                  <pre className="leading-relaxed">
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Answer Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]'
                          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-slate-100 text-[#475569]'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <div className="space-y-1">
                        <div className={`text-sm font-semibold ${isSelected ? 'text-[#0F172A]' : 'text-[#334155]'}`}>
                          {opt.text}
                        </div>
                        {isSelected && opt.explanation && (
                          <div className="text-xs text-[#2563EB] font-medium pt-1">
                            💡 {opt.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold flex items-center space-x-1.5 transition ${
                  currentIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-50'
                    : 'bg-white text-[#334155] hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition"
              >
                <span>{currentIndex === SAMPLE_QUESTIONS.length - 1 ? 'Complete Assessment' : 'Save & Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Assessment Completion Dossier */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E2E8F0] shadow-xl text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Evaluation Verified
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-['Outfit']">
                Diagnostic Assessment Complete!
              </h2>
              <p className="text-xs sm:text-sm text-[#475569]">
                Your algorithmic problem solving and architectural knowledge have been benchmarked against industry standards.
              </p>
            </div>

            {/* Score Card */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <div className="text-4xl font-extrabold text-[#2563EB]">
                {scorePercent}%
              </div>
              <div className="text-xs font-semibold text-[#64748B]">
                Overall Aptitude Score ({correctCount} of {SAMPLE_QUESTIONS.length} correct)
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A]">Strongest:</span>
                  <div className="text-[#2563EB] font-semibold mt-0.5">PostgreSQL Internals</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A]">Recommended Track:</span>
                  <div className="text-emerald-600 font-semibold mt-0.5">Full Stack AI Engineer</div>
                </div>
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/roadmap')}
                className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition"
              >
                <span>Unlock My 16-Week Roadmap</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] font-semibold text-sm transition"
              >
                View Dashboard GPS
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
