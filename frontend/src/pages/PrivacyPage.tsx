import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FD] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-2xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Last updated: November 2026 &bull; Data Protection &amp; Student Rights</p>
          </div>
        </div>

        <div className="prose prose-slate prose-xs max-w-none space-y-4 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-800">1. Information We Collect</h2>
          <p>
            We collect basic academic registration data (name, email, institutional affiliation, graduation year), diagnostic question responses, assignment code files, and audio recordings from oral viva defense sessions.
          </p>

          <h2 className="text-sm font-bold text-slate-800">2. How Your Data is Used</h2>
          <p>
            Your information powers the career recommendation model, computes your merit score radar, and generates your verifiable Career Passport. We never sell your personal contact information to third-party advertisers.
          </p>

          <h2 className="text-sm font-bold text-slate-800">3. Cryptographic Ledger &amp; Public Verification</h2>
          <p>
            When you earn a Disheera Career Passport, a tamper-proof SHA-256 cryptographic digest is published on the verification ledger. Employers verify credentials via this hash without exposing private student contact details.
          </p>

          <h2 className="text-sm font-bold text-slate-800">4. Data Deletion &amp; Export</h2>
          <p>
            Students have full rights to request complete account deletion or export their academic dossiers at any time by contacting support@disheera.site.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">
            &larr; Back to Disheera Home
          </Link>
        </div>
      </div>
    </div>
  );
};
