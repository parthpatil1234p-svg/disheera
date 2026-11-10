import React, { useState } from 'react';
import { 
  CheckCircle2, 
  PlayCircle, 
  Lock, 
  FileDown, 
  UploadCloud, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface Sprint {
  id: number;
  week: number;
  title: string;
  category: string;
  status: 'completed' | 'active' | 'locked';
  grade?: number;
  videoTitle: string;
  videoDuration: string;
  dedicationPercent?: number;
  assignmentTitle: string;
  partAAvailable: boolean;
  partBSubmitted: boolean;
}

const SAMPLE_SPRINTS: Sprint[] = [
  {
    id: 1,
    week: 1,
    title: 'TypeScript Enterprise Foundations & Component Trees',
    category: 'Architecture',
    status: 'completed',
    grade: 9.6,
    videoTitle: 'TypeScript Generics & React Component Lifecycles',
    videoDuration: '48 mins',
    dedicationPercent: 100,
    assignmentTitle: 'Semantic Foundations & Reconciliation Matrix',
    partAAvailable: true,
    partBSubmitted: true,
  },
  {
    id: 2,
    week: 2,
    title: 'RESTful API Contracts & Libuv Event Loop',
    category: 'Backend Architecture',
    status: 'completed',
    grade: 9.2,
    videoTitle: 'Node.js Libuv Microtask vs Macrotask Phases',
    videoDuration: '54 mins',
    dedicationPercent: 95,
    assignmentTitle: 'Asynchronous Event Loop & Idempotency Receiver',
    partAAvailable: true,
    partBSubmitted: true,
  },
  {
    id: 3,
    week: 3,
    title: 'PostgreSQL Optimization, Indexing & ACID Transactions',
    category: 'Database Internals',
    status: 'active',
    videoTitle: 'PostgreSQL GIN vs B-Tree Indexing Deep Dive',
    videoDuration: '42 mins',
    dedicationPercent: 85,
    assignmentTitle: 'Plan 46 Collegiate Laboratory: SQL Index Benchmark',
    partAAvailable: true,
    partBSubmitted: false,
  },
  {
    id: 4,
    week: 4,
    title: 'Distributed Caching, Redis Pub/Sub & Stampede Protection',
    category: 'Distributed Systems',
    status: 'locked',
    videoTitle: 'Cache-Aside Pattern & Mutex Lock Algorithms',
    videoDuration: '46 mins',
    assignmentTitle: 'Cache Stampede & Distributed Mutex Simulation',
    partAAvailable: false,
    partBSubmitted: false,
  },
  {
    id: 5,
    week: 5,
    title: 'Docker Microservices & Kubernetes Deployment',
    category: 'DevOps & SRE',
    status: 'locked',
    videoTitle: 'Multi-Stage Dockerfiles & Pod Scheduling',
    videoDuration: '62 mins',
    assignmentTitle: 'Production Container Hardening & Non-Root Contexts',
    partAAvailable: false,
    partBSubmitted: false,
  }
];

export const RoadmapPage: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState('Full Stack AI Engineer');
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const completedCount = SAMPLE_SPRINTS.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / SAMPLE_SPRINTS.length) * 100);

  const handleDownloadPartA = (weekNum: number) => {
    window.open(`/api/assignments/cover-pdf?week=${weekNum}`, '_blank');
  };

  const handleUploadPartB = () => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FD] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Track Switcher & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                Active Enrolled Track
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Collegiate Accredited</span>
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setTrackMenuOpen(!trackMenuOpen)}
                className="flex items-center space-x-2 text-xl sm:text-2xl font-extrabold text-[#0F172A] font-['Outfit'] hover:text-[#2563EB] transition"
              >
                <span>{selectedTrack}</span>
                <ChevronDown className="w-5 h-5 text-[#64748B]" />
              </button>

              {trackMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-[#E2E8F0] shadow-xl p-2 z-50">
                  {['Full Stack AI Engineer', 'Cloud DevOps Specialist', 'Data Intelligence Architect'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTrack(t);
                        setTrackMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-right space-y-1 sm:border-l sm:border-[#F1F5F9] sm:pl-6">
            <div className="text-xs font-bold text-[#64748B]">Roadmap Completion</div>
            <div className="text-2xl font-extrabold text-[#2563EB]">{progressPercent}%</div>
            <div className="text-[11px] text-[#94A3B8]">{completedCount} of {SAMPLE_SPRINTS.length} Milestones Cleared</div>
          </div>
        </div>

        {/* Milestone Tree */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Chronological Learning Sprints</h2>
            <span className="text-xs font-semibold text-[#64748B]">Plan 46 Continuous Evaluation</span>
          </div>

          <div className="space-y-4">
            {SAMPLE_SPRINTS.map((sprint) => {
              const isCompleted = sprint.status === 'completed';
              const isActive = sprint.status === 'active';
              const isLocked = sprint.status === 'locked';

              return (
                <div
                  key={sprint.id}
                  className={`rounded-2xl transition-all ${
                    isActive
                      ? 'bg-white border-2 border-[#2563EB] shadow-md p-6'
                      : isCompleted
                      ? 'bg-white border border-[#E2E8F0] p-5 hover:border-[#BFDBFE]'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] opacity-70 p-5'
                  }`}
                >
                  {/* Sprint Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center space-x-3">
                      {isCompleted && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                          ▶
                        </div>
                      )}
                      {isLocked && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#64748B] uppercase">Week {sprint.week}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {sprint.category}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">
                          {sprint.title}
                        </h3>
                      </div>
                    </div>

                    <div>
                      {isCompleted && (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          Grade: {sprint.grade} / 10.0
                        </span>
                      )}
                      {isActive && (
                        <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE]">
                          Active Sprint
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-xs font-semibold text-[#94A3B8]">
                          Prerequisite: Sprint {sprint.week - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Sprint Expanded Details */}
                  {isActive && (
                    <div className="pt-5 space-y-6">
                      {/* Curated Video Chamber */}
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <PlayCircle className="w-5 h-5 text-[#2563EB]" />
                            <span className="text-xs font-bold text-[#0F172A]">Curated Learning Chamber</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{sprint.dedicationPercent}% Watched · Checkpoint Passed</span>
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">{sprint.videoTitle}</div>
                            <div className="text-xs text-[#64748B]">Duration: {sprint.videoDuration} · Full Focus Dedication Timer Active</div>
                          </div>
                          <button
                            onClick={() => window.open('https://youtube.com', '_blank')}
                            className="px-4 py-2 rounded-lg bg-white border border-[#CBD5E1] text-[#2563EB] hover:bg-blue-50 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                          >
                            <span>Open Video Chamber</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Collegiate Weekly Assignment (Plan 46 Standard) */}
                      <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-[#2563EB]" />
                            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                              Collegiate Weekly Assignment (Plan 46)
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#2563EB] bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                            Max 10.0 Marks
                          </span>
                        </div>

                        <p className="text-xs text-[#475569] leading-relaxed">
                          Download your personalized 1-page Cover Sheet (Part A). Attach your step-by-step technical solution PDF (Part B). Our AI Evaluator benchmarks against the 4D Rubric (Accuracy, Rigour, Schematics, Clarity).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Part A Download */}
                          <button
                            onClick={() => handleDownloadPartA(sprint.week)}
                            className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-xs transition text-left flex items-center space-x-3 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                              <FileDown className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0F172A]">Download Part A Cover</div>
                              <div className="text-[10px] text-[#64748B]">Official 1-Page PDF with Seal</div>
                            </div>
                          </button>

                          {/* Part B Upload */}
                          <div
                            onClick={handleUploadPartB}
                            className="p-3.5 rounded-xl bg-white border border-dashed border-[#2563EB] hover:bg-blue-50/50 transition cursor-pointer text-left flex items-center space-x-3 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0F172A]">
                                {uploadSuccess ? '✅ Solution Uploaded & In Grading!' : 'Upload Solution (Part B)'}
                              </div>
                              <div className="text-[10px] text-[#64748B]">PDF with min 2 pages + Part A</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Certificate Claim */}
                      <div className="pt-2 flex items-center justify-between border-t border-[#F1F5F9]">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B]">
                          <Award className="w-4 h-4 text-[#2563EB]" />
                          <span>Unlocks upon Part B submission & 7.0+ grade</span>
                        </div>
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200"
                        >
                          Claim Milestone 3 Certificate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
