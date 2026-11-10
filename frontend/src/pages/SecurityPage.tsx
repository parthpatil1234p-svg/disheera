import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server, KeyRound, CheckCircle2 } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FD] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-2xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Security &amp; Tamper Resistance</h1>
            <p className="text-xs text-slate-500">Zero-Trust Credential Architecture &bull; ISO &amp; SOC-Ready Standards</p>
          </div>
        </div>

        <div className="prose prose-slate prose-xs max-w-none space-y-4 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-800">1. Cryptographic Hashes &amp; Tamper Evidence</h2>
          <p>
            Every certificate and Career Passport issued on Disheera carries a unique SHA-256 digital signature tied to the student's submission timeline and oral viva evaluation transcript. Modifying any field immediately invalidates the signature.
          </p>

          <h2 className="text-sm font-bold text-slate-800">2. Assessment Anti-Cheating Defenses</h2>
          <p>
            Diagnostic assessments feature randomized question shuffling, client-side blur and focus tracking, anti-copy listeners, and real-time dedication timers to guarantee authentic diagnostic integrity.
          </p>

          <h2 className="text-sm font-bold text-slate-800">3. Encryption in Transit &amp; at Rest</h2>
          <p>
            All network communication operates over TLS 1.3 encryption. Passwords and sensitive tokens are hashed using bcrypt with adaptive salt work factors. Database clusters enforce automated snapshotting and access auditing.
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
