import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Map, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  FileCheck2, 
  Lock,
  ChevronRight,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const tracks = [
    {
      title: 'Full Stack AI Engineer',
      level: '16 Sprints',
      desc: 'Next.js, TypeScript, PostgreSQL query optimization, libuv event loop, and vector search.',
      color: 'from-blue-500 to-indigo-600',
      tag: 'Highest Demand'
    },
    {
      title: 'Cloud DevOps Specialist',
      level: '14 Sprints',
      desc: 'Docker orchestration, Kubernetes clusters, Prometheus SRE golden signals, and Terraform.',
      color: 'from-emerald-500 to-teal-600',
      tag: 'Enterprise Standard'
    },
    {
      title: 'Data Intelligence Architect',
      level: '15 Sprints',
      desc: 'Distributed data pipelines, BigQuery SQL tuning, DuckDB analytics, and LLM prompt engineering.',
      color: 'from-purple-500 to-violet-600',
      tag: 'High Growth'
    },
    {
      title: 'Cybersecurity & AppSec Engineer',
      level: '14 Sprints',
      desc: 'OWASP Top 10 defenses, cryptographic hashing, JWT security hygiene, and zero trust models.',
      color: 'from-rose-500 to-red-600',
      tag: 'Critical Security'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FD] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent pointer-events-none blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Institutional Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Autonomous Career GPS · Plan 46 Institutional Verification</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0F172A] tracking-tight max-w-4xl mx-auto font-['Outfit'] leading-tight">
            Stop guessing your tech career. <br />
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] bg-clip-text text-transparent">
              Navigate with verified proof.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Disheera replaces chaotic tutorials with structured 16-week learning sprints, anti-cheat AI assessments, collegiate laboratory assignments, and verifiable talent passports.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/assessment"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Free AI Diagnostic</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to="/roadmap"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] font-bold text-sm sm:text-base shadow-xs transition hover:border-[#94A3B8]"
            >
              Explore Career Roadmaps
            </Link>
          </div>

          {/* Proof Strip */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-center">
              <div className="text-2xl font-extrabold text-[#0F172A]">100%</div>
              <div className="text-xs font-semibold text-[#64748B] mt-0.5">Verifiable Credentials</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-center">
              <div className="text-2xl font-extrabold text-[#2563EB]">16 Weeks</div>
              <div className="text-xs font-semibold text-[#64748B] mt-0.5">Structured Sprints</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-center">
              <div className="text-2xl font-extrabold text-emerald-600">4D Rubric</div>
              <div className="text-xs font-semibold text-[#64748B] mt-0.5">Collegiate Grading</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-center">
              <div className="text-2xl font-extrabold text-indigo-600">Voice Viva</div>
              <div className="text-xs font-semibold text-[#64748B] mt-0.5">Oral Defense Proof</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Architecture */}
      <section className="py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">How Disheera Works</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] font-['Outfit']">
              From confused student to verified hire in 3 phases
            </h2>
            <p className="text-sm text-[#475569]">
              Every milestone is backed by real code repositories, anti-cheat dedication timers, and official laboratory evaluation dossiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">AI Career Diagnostic Chamber</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Take a 15-minute adaptive skill assessment with real code debugging, server-side Fisher-Yates anti-cheat question scrambling, and precision aptitude scoring.
              </p>
              <div className="flex items-center text-xs font-semibold text-[#2563EB] pt-2">
                <span>Try Diagnostic Quiz</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Autonomous Sprint Roadmaps</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Follow chronological weekly learning sprints. Access dedicated YouTube learning chambers, download Part A collegiate covers, and upload solution PDFs for 4D AI grading.
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-600 pt-2">
                <span>View Full Roadmap</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Career Passport & Viva Defense</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Complete your Voice Viva oral defense recording, generate ATS LaTeX resumes with cryptographic verification IDs, and share your public credential dossier with recruiters.
              </p>
              <div className="flex items-center text-xs font-semibold text-purple-600 pt-2">
                <span>Verify Credentials</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pathways */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Engineered Pathways</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] font-['Outfit'] mt-1">
              Select your career destination
            </h2>
          </div>
          <Link to="/assessment" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center">
            <span>Take test to get AI recommendation</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#BFDBFE] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#DBEAFE]">
                  {t.tag}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] leading-snug">{t.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{t.desc}</p>
              </div>
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#475569]">{t.level}</span>
                <Link
                  to="/roadmap"
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center"
                >
                  <span>Start</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] p-8 sm:p-12 text-white text-center space-y-6 shadow-xl shadow-blue-500/15">
          <GraduationCap className="w-12 h-12 mx-auto text-blue-200" />
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] max-w-2xl mx-auto">
            Ready to build an irrefutable engineering portfolio?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Take the 15-minute diagnostic assessment now. Get your personalized sprint roadmap and start earning verified milestone badges.
          </p>
          <div className="pt-2">
            <Link
              to="/assessment"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-white text-[#2563EB] font-bold text-sm sm:text-base hover:bg-blue-50 transition shadow-md"
            >
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              <span>Launch Free Career Diagnostic</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
