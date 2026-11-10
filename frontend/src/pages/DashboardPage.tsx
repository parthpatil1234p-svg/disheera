import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Map, 
  Award, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Briefcase,
  PlayCircle,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const studentName = user?.name || 'Aarav Sharma';

  return (
    <div className="min-h-screen bg-[#F7F9FD] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                Active Enrolled Candidate
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WhatsApp 2-Step Verified</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-['Outfit']">
              Welcome back, {studentName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Active Track: <strong className="text-[#0F172A]">Full Stack AI Engineer</strong> · Next Deliverable: <span className="text-[#2563EB] font-bold">Week 3 SQL Index Lab</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/roadmap"
              className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold transition flex items-center space-x-2 shadow-md shadow-blue-500/20"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Sprint 3</span>
            </Link>
          </div>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
              <span>Readiness Score</span>
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A]">88.5%</div>
            <div className="text-[11px] font-semibold text-emerald-600">+4.2% since diagnostic</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
              <span>Sprints Cleared</span>
              <Map className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A]">2 / 16</div>
            <div className="text-[11px] font-semibold text-[#2563EB]">Sprint 3 In-Progress</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
              <span>Average Grade</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A]">9.4 / 10</div>
            <div className="text-[11px] font-semibold text-purple-600">Plan 46 Top 5%</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
              <span>Dedication Time</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-[#0F172A]">14h 20m</div>
            <div className="text-[11px] font-semibold text-amber-700">All Checkpoints Passed</div>
          </div>
        </div>

        {/* 2-Column Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Action Hub (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A]">Current Sprint Focus</h3>
                <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  Sprint 3 of 16
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="text-sm font-bold text-[#0F172A]">
                  PostgreSQL Optimization, Indexing & ACID Transactions
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Understand B-Tree vs GIN indexing tradeoffs, write-ahead logging (WAL), row-level locks, and multi-table ACID transaction safety.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Link
                    to="/roadmap"
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <span>Open Sprint Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Feature Launchpad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/passport"
                className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-xs hover:shadow-sm transition text-left space-y-2 block"
              >
                <Award className="w-6 h-6 text-[#2563EB]" />
                <div className="text-xs font-bold text-[#0F172A]">Career Passport</div>
                <div className="text-[11px] text-[#64748B]">Verify oral viva & milestones</div>
              </Link>

              <Link
                to="/resume-builder"
                className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-xs hover:shadow-sm transition text-left space-y-2 block"
              >
                <FileCheck2 className="w-6 h-6 text-emerald-600" />
                <div className="text-xs font-bold text-[#0F172A]">ATS Resume Studio</div>
                <div className="text-[11px] text-[#64748B]">LaTeX export with QR proof</div>
              </Link>

              <Link
                to="/assessment"
                className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] shadow-xs hover:shadow-sm transition text-left space-y-2 block"
              >
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div className="text-xs font-bold text-[#0F172A]">Skill Diagnostic</div>
                <div className="text-[11px] text-[#64748B]">Adaptive test & gap analyzer</div>
              </Link>
            </div>
          </div>

          {/* Right Sidebar: Recommended Jobs & Market Match (1 col) */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>Verified Match Jobs</span>
                </h3>
                <Link to="/jobs" className="text-[11px] font-bold text-[#2563EB] hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold text-[#0F172A]">Junior Backend Engineer</div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      92% Match
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">Acme Systems · Pune (Hybrid)</div>
                  <div className="text-[11px] font-mono text-[#0F172A] font-bold">₹8.5L – ₹12.0L / yr</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold text-[#0F172A]">Full Stack Associate</div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      89% Match
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">NexTalent Cloud · Remote</div>
                  <div className="text-[11px] font-mono text-[#0F172A] font-bold">₹7.0L – ₹10.5L / yr</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
