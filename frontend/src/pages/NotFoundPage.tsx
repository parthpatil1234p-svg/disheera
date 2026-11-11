import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, ShieldCheck } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FD] flex flex-col items-center justify-center py-12 px-4 text-center">
      <img src="/logo.svg" alt="Disheera Logo" className="w-16 h-16 object-contain mb-4 shadow-2xs hover:scale-105 transition-transform" />
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Pathway Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The destination you are navigating to does not exist or has been relocated within the Disheera Career Atlas.
      </p>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
        >
          <span>Return Home</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all"
        >
          Career Dashboard
        </Link>
      </div>
    </div>
  );
};
