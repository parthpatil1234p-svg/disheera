import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Mail, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFFFFF] border-t border-[#E2E8F0] pt-12 pb-8 text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#F1F5F9]">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl p-[1.5px] bg-gradient-to-tr from-[#00F2FE] via-[#2563EB] to-[#8B5CF6] shadow-xs">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden p-0.5">
                  <img 
                    src="/logo.png" 
                    alt="Disheera Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (!t.src.endsWith('/logo.svg')) t.src = '/logo.svg';
                    }}
                  />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A] font-['Outfit']">
                Dishe<span className="text-[#2563EB]">era</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Autonomous Career GPS & Verified Talent Operating System. Helping students navigate tech milestones with verified code artifacts and institutional proof.
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifiable Credential Standard</span>
            </div>
          </div>

          {/* Navigation Tracks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Product GPS</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/assessment" className="hover:text-[#2563EB] transition">AI Skill Diagnostic</Link></li>
              <li><Link to="/roadmap" className="hover:text-[#2563EB] transition">Weekly Sprint Roadmaps</Link></li>
              <li><Link to="/passport" className="hover:text-[#2563EB] transition">Career Passport & Viva</Link></li>
              <li><Link to="/resume-builder" className="hover:text-[#2563EB] transition">ATS LaTeX Resume Studio</Link></li>
              <li><Link to="/recommendations" className="hover:text-[#2563EB] transition">Market Gap Analytics</Link></li>
            </ul>
          </div>

          {/* Institutional Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Institutional</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/recruiter-dashboard" className="hover:text-[#2563EB] transition">Recruiter Talent Cockpit</Link></li>
              <li><Link to="/jobs" className="hover:text-[#2563EB] transition">Job Opportunities</Link></li>
              <li><a href="https://admin.disheera.site" target="_blank" rel="noreferrer" className="hover:text-[#2563EB] transition">Campus Administration</a></li>
              <li><a href="mailto:support@disheera.site" className="hover:text-[#2563EB] transition flex items-center space-x-1.5"><Mail className="w-3.5 h-3.5" /><span>support@disheera.site</span></a></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Trust & Security</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/privacy" className="hover:text-[#2563EB] transition">Privacy Charter</Link></li>
              <li><Link to="/terms" className="hover:text-[#2563EB] transition">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-[#2563EB] transition">Security & Encryption</Link></li>
              <li><span className="text-[11px] text-[#94A3B8]">Licensed under AGPL-3.0</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] gap-4">
          <p>© {new Date().getFullYear()} Disheera Technologies Inc. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Built with precision for authentic student engineering</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
