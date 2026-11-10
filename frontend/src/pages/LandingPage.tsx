import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Cloud, 
  Lock, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Radar, 
  Building2, 
  Award,
  FileCheck2,
  Route,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="w-full pt-24 md:pt-28 pb-20">
      
      {/* ============================================================
           1. ASYMMETRIC HERO SECTION (7:5 SPLIT)
           ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Institutional Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 w-fit">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">
                Disheera Official &bull; Career Planning Platform
              </span>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] text-balance">
                Build skills. <span className="text-blue-600">Plan your next</span> career move.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Choose a target role, follow a personalized roadmap, and practice with guided projects. Keep your verified skills together in a shareable career passport.
              </p>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/assessment"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Start Free Skill Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/verify"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98]"
              >
                <FileCheck2 className="w-4 h-4 text-slate-500" />
                <span>Explore Verifiable Credentials</span>
              </Link>
            </div>

            {/* Audience Strip */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                For Students &amp; Graduates
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                For Colleges &amp; Placement Cells
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                For Verified Tech Recruiters
              </span>
            </div>

          </div>

          {/* Right Column: 5 cols (Interactive Career Workflow Preview) */}
          <div className="lg:col-span-5 relative">
            <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.12)] flex flex-col gap-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[11px] uppercase font-bold tracking-wider text-blue-600">
                  Your Career Workflow
                </span>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  A clear path from learning to showing verified proof
                </h2>
              </div>

              <ol className="flex flex-col gap-3 m-0 p-0 list-none">
                <li className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Assess your skills</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Anti-cheat scrambled diagnostic reveals your empirical baseline.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Follow a visual roadmap</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subway-station highway with weekly Plan 46 assignments.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Share your progress</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      SHA-256 Career Passport with oral AI viva defense evidence.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="pt-2 text-center">
                <Link
                  to="/roadmap"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Explore Interactive Highway Stations</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
           2. ASYMMETRIC BENTO GRID: CAREER TRACKS (#career-tracks)
           ============================================================ */}
      <section id="career-tracks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Radar className="w-4 h-4" />
              <span>Career Learning Pathways</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Targeted Tech Tracks
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Curated engineering paths with verifiable milestone checkpoints and oral defense preparation.
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 self-start md:self-end"
          >
            <span>View All 15+ Career Tracks</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Asymmetric Bento Grid: 7:5 and 6:6 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bento 1: Full Stack Web Engineering (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between hover:border-blue-400 transition-all group">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Full Stack Web Engineering
                    </h3>
                    <span className="text-xs text-slate-500">Frontend, backend, APIs, and databases</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  94% Match
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['React.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'System Design'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Roadmap Sprints
                </span>
                <span className="text-xs font-medium text-slate-700">
                  8-to-12 weeks structured Plan 46 assignments leading to verified job readiness.
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Est. Compensation: ₹8.5L – ₹18.0L</span>
              <Link
                to="/roadmap?track=fullstack"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>Launch Roadmap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bento 2: AI & Data Engineering (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
                High Demand
              </span>
            </div>

            <div className="flex flex-col gap-4 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    AI &amp; Data Engineering
                  </h3>
                  <span className="text-xs text-slate-500">LLMs, RAG, PyTorch, and vector DBs</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Python', 'PyTorch', 'LangChain', 'Vector DBs', 'FastAPI'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                  Autonomous AI Readiness
                </span>
                <p className="text-xs text-slate-700">
                  Build production RAG pipelines, model evaluations, and agent swarms with zero hallucination.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Est. Compensation: ₹12.0L – ₹24.0L</span>
              <Link
                to="/roadmap?track=ai_data"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>Launch Roadmap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bento 3: Cloud DevOps & SRE (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between hover:border-blue-400 transition-all group">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-cyan-600">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Cloud DevOps &amp; SRE
                  </h3>
                  <span className="text-xs text-slate-500">Kubernetes, Terraform, AWS, and CI/CD</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Kubernetes', 'Terraform', 'AWS Architecture', 'Docker', 'Prometheus'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Master automated zero-downtime deployments, distributed telemetry, and high-availability cloud infrastructure.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Est. Compensation: ₹9.0L – ₹20.0L</span>
              <Link
                to="/roadmap?track=devops"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>Launch Roadmap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bento 4: Cybersecurity & SecOps (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between hover:border-blue-400 transition-all group">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Cybersecurity &amp; SecOps
                  </h3>
                  <span className="text-xs text-slate-500">Network security, OWASP, and SOC defense</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['OWASP Top 10', 'Penetration Testing', 'Cryptography', 'SIEM', 'Cloud Security'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Defend enterprise attack surfaces, identify zero-day vulnerabilities, and conduct verifiable red-team audits.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Est. Compensation: ₹10.0L – ₹22.0L</span>
              <Link
                to="/roadmap?track=cybersecurity"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>Launch Roadmap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
           3. INSTITUTIONAL RECRUITER & TPO CTA
           ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              Institutional Talent Scouting
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3 mb-2 tracking-tight">
              Hiring Engineering Talent? Skip Resume Screening.
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Access pre-screened students with verified Plan 46 code submissions, tamper-proof SHA-256 credentials, and recorded oral AI viva defenses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10">
            <Link
              to="/recruiter-dashboard"
              className="px-6 py-3.5 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-all text-center shadow-md"
            >
              Open Recruiter Cockpit
            </Link>
            <Link
              to="/verify"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs rounded-xl transition-all text-center"
            >
              Verify Candidate Token
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
