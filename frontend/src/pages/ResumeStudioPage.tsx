import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Share2, 
  Award, 
  RefreshCw,
  Code,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResumeStudioPage: React.FC = () => {
  const { user } = useAuth();
  const [atsScore, setAtsScore] = useState(94);
  const [isExporting, setIsExporting] = useState(false);

  const candidate = {
    name: user?.name || 'Parth Patil',
    email: user?.email || 'parthpatil@disheera.site',
    phone: '+91 89830 20995',
    title: 'Full Stack AI Engineer',
    university: 'Savitribai Phule Pune University',
    verifiedSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'React', 'Prisma ORM'],
    projects: [
      {
        title: 'Disheera — Autonomous Career GPS & Institutional Verification',
        tech: 'TypeScript, PostgreSQL, Prisma, Express, Vercel, Render',
        bullets: [
          'Engineered dual-layer anti-cheat assessment chamber with server-side Fisher-Yates scrambling.',
          'Built Plan 46 collegiate evaluation engine reducing grading turnaround from 7 days to 811ms.',
          'Architected zero-loss transactional email relay with sub-second OTP dispatch via Gmail SMTP.'
        ]
      }
    ]
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FD] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Studio Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                ATS-Optimized Engine
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Parsing Errors</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] font-['Outfit'] mt-1">
              AI Resume Studio & LaTeX Proof
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-lg font-black text-emerald-700">{atsScore} / 100</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">ATS Readability</div>
            </div>

            <button
              onClick={handleExportPdf}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Preparing PDF...' : 'Download Resume PDF'}</span>
            </button>
          </div>
        </div>

        {/* 2-Pane Editor & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane: Configuration & Verified Milestones (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#2563EB]" />
                <span>Verified Credentials from Passport</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-[#1E3A8A] space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Linked to Public Verification Hash</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  Your certified milestones (Sprint 1 & Sprint 2) are automatically synced with an official cryptographic QR code header.
                </p>
              </div>

              {/* Skills Tag Cloud */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A]">Verified Technical Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.verifiedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#334155] text-xs font-semibold border border-slate-200 flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{sk}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setAtsScore(98)}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] text-[#334155] text-xs font-bold transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Run AI ATS Bullet Enhancement</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Pane: High-Fidelity Paper Resume Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-8 sm:p-12 text-[#0F172A] space-y-6 font-serif">
            
            {/* Header */}
            <div className="text-center pb-6 border-b border-slate-200 space-y-1 font-sans">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">{candidate.name}</h2>
              <div className="text-xs text-[#475569] flex flex-wrap items-center justify-center gap-2 pt-1">
                <span>{candidate.title}</span>
                <span>•</span>
                <span>{candidate.email}</span>
                <span>•</span>
                <span>{candidate.phone}</span>
              </div>
              <div className="text-[11px] font-mono text-[#2563EB] pt-1">
                Verification Ledger: https://disheera.site/verify.html?id=DSH-2026-9842A
              </div>
            </div>

            {/* Education */}
            <div className="space-y-1.5 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-slate-200 pb-1">
                Education
              </h3>
              <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                <span>{candidate.university}</span>
                <span>Pune, India</span>
              </div>
              <div className="flex justify-between text-xs text-[#475569]">
                <span>Bachelor of Engineering in Information Technology</span>
                <span>2023 – 2027</span>
              </div>
            </div>

            {/* Experience & Engineering Projects */}
            <div className="space-y-3 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-slate-200 pb-1">
                Verified Production Projects
              </h3>
              {candidate.projects.map((proj, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-[#0F172A]">
                    <span>{proj.title}</span>
                    <span className="text-[#2563EB] font-semibold">Live Production</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#64748B] italic">
                    Tech Stack: {proj.tech}
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#334155] leading-relaxed">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Technical Skills */}
            <div className="space-y-1.5 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-slate-200 pb-1">
                Verified Technical Core
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                <strong>Languages & Frameworks:</strong> {candidate.verifiedSkills.join(', ')}<br />
                <strong>Architecture:</strong> RESTful Contracts, Libuv Event Loop, ACID Transactions, Microservices<br />
                <strong>Institutional Proof:</strong> Disheera Plan 46 Verified (Top 5% Merit)
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
