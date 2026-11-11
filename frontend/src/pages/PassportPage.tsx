import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Mic, 
  Square, 
  Play, 
  Share2, 
  CheckCircle2, 
  QrCode, 
  Download, 
  ExternalLink,
  Sparkles,
  FileBadge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const PassportPage: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [vivaRecorded, setVivaRecorded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passportData, setPassportData] = useState<any>(null);

  useEffect(() => {
    fetchLivePassport();
  }, [user]);

  const fetchLivePassport = async () => {
    try {
      const res = await api.get(`/passport/${user?.id || 'parth'}`);
      if (res && res.data && res.data.passport) {
        setPassportData(res.data.passport);
      }
    } catch (_) {}
  };

  const candidateName = passportData?.name || user?.name || 'Parth Patil';
  const passportId = passportData?.studentId || 'DSH-2026-9842A';
  const collegeName = passportData?.college || 'Savitribai Phule Pune University';
  const trackName = passportData?.degreeBranch || 'Full Stack AI Engineer';
  const publicVerifyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify?id=${passportId}`
    : `https://disheera.site/verify?id=${passportId}`;

  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setVivaRecorded(true);
      try {
        await api.post('/viva/evaluate', { duration: recordingTime, studentId: passportId });
      } catch (_) {}
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            clearInterval(interval);
            setIsRecording(false);
            setVivaRecorded(true);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicVerifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FD] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Passport Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-indigo-600 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md shadow-blue-500/20">
              {candidateName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-['Outfit']">
                  {candidateName}
                </h1>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Talent</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#475569]">
                Candidate Track: <strong className="text-[#0F172A]">{trackName}</strong> · ID: <span className="font-mono text-[#2563EB] font-bold">{passportId}</span>
              </p>
              <div className="flex items-center space-x-4 pt-1 text-xs text-[#64748B]">
                <span>Institution: <strong>{collegeName}</strong></span>
                <span>•</span>
                <span>Merit Standing: <strong>Top 5%</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#334155] text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4 text-[#2563EB]" />
              <span>{copied ? 'Copied Public Link!' : 'Share Passport'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Dossier</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Verified Milestones & Credentials (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-[#2563EB]" />
                <span>Cryptographic Milestone Credentials</span>
              </h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                2 Cleared · 1 In-Progress
              </span>
            </div>

            <div className="space-y-4">
              {/* Credential 1 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">Milestone 1: TypeScript Enterprise Architecture</div>
                      <div className="text-xs text-[#64748B]">Issued: Oct 12, 2026 · Collegiate Grade: 9.6/10.0 Marks</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    PASS
                  </span>
                </div>
                <div className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#64748B]">SHA-256: 8f2a...c01e</span>
                  <a href={publicVerifyUrl} target="_blank" rel="noreferrer" className="text-[#2563EB] font-bold hover:underline flex items-center space-x-1">
                    <span>Verify Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Credential 2 */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">Milestone 2: RESTful Microservices & Libuv Internals</div>
                      <div className="text-xs text-[#64748B]">Issued: Oct 26, 2026 · Collegiate Grade: 9.2/10.0 Marks</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    PASS
                  </span>
                </div>
                <div className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#64748B]">SHA-256: 4b1c...910a</span>
                  <a href={publicVerifyUrl} target="_blank" rel="noreferrer" className="text-[#2563EB] font-bold hover:underline flex items-center space-x-1">
                    <span>Verify Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Student Voice Viva Chamber */}
            <div className="p-6 rounded-3xl bg-white border-2 border-indigo-500/30 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Candidate Voice Viva Oral Defense</h3>
                    <p className="text-[11px] text-[#64748B]">Anti-Cheating Audio Proof for Corporate Recruiters</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  Plan 46 Required
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="text-xs font-bold text-[#0F172A]">Assigned Defense Question:</div>
                <p className="text-xs text-[#334155] leading-relaxed italic bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  "In your Sprint 2 solution, explain how you mitigated event loop starvation in Node.js when processing high-volume telemetry packets, and why you selected process.nextTick over setImmediate."
                </p>

                {/* Audio Recording Controls */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={handleToggleRecord}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? `Stop Recording (${recordingTime}s)` : 'Record 2-Min Defense'}</span>
                  </button>

                  {vivaRecorded && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Oral Defense Recorded & Linked to Dossier</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Public Recruiter QR & Verification Metadata */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Public Verification QR</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Recruiters scan this code on paper resumes to instantly verify your passing status.
                </p>
              </div>

              {/* QR Dummy Visualization */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] inline-block">
                <div className="w-36 h-36 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-mono p-2">
                  [DISHEERA-QR-VERIFY]
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={publicVerifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                >
                  <span>Open Live Verify Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Institutional Seal */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1E3A8A] text-white space-y-3">
              <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Anti-Cheat Verification Ledger</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All laboratory grades are evaluated using Disheera Plan 46 dual-layer anti-AI detectors and collegiate scoring metrics.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
