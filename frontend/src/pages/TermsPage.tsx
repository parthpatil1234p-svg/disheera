import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FD] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-2xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500">Last updated: November 2026 &bull; Disheera Technologies Inc.</p>
          </div>
        </div>

        <div className="prose prose-slate prose-xs max-w-none space-y-4 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-800">1. Acceptance of Terms</h2>
          <p>
            By creating an account, assessing career pathways, or submitting Plan 46 collegiate assignments on Disheera, you agree to comply with and be bound by these Terms of Service.
          </p>

          <h2 className="text-sm font-bold text-slate-800">2. Academic &amp; Verification Integrity</h2>
          <p>
            Disheera relies on honest, verifiable student submissions. Any automated cheating, question scraping, or submission of plagiarized code artifacts without proper attribution will result in immediate disqualification and revocation of the Disheera Career Passport.
          </p>

          <h2 className="text-sm font-bold text-slate-800">3. Recruiter Access &amp; Talent Scouting</h2>
          <p>
            Employers and recruiters access candidate dossiers exclusively through authenticated institutional channels. Verified scores and oral viva defense records are rendered strictly for talent evaluation purposes.
          </p>

          <h2 className="text-sm font-bold text-slate-800">4. Intellectual Property</h2>
          <p>
            Students retain ownership of their original code and assignment submissions. Disheera retains rights to the evaluation framework, proprietary 60/25/15 calibration algorithms, and platform marks.
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
