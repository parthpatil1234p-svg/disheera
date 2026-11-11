import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Map, 
  Award, 
  FileText, 
  Briefcase, 
  LogOut, 
  Menu, 
  X, 
  Radar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Career Tracks', path: '/recommendations', icon: Radar },
    { name: 'Weekly Sprints', path: '/roadmap', icon: Map },
    { name: 'Career Passport', path: '/passport', icon: Award },
    { name: 'Market Radar', path: '/jobs', icon: Briefcase },
    { name: 'Resume Studio', path: '/resume-builder', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto">
        <div className="pointer-events-auto h-16 md:h-18 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full shadow-[0_20px_45px_-12px_rgba(15,23,42,0.12)] px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img 
              src="/logo.svg" 
              alt="Disheera Logo" 
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Dishe<span className="text-blue-600">era</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest scale-90 -ml-1 mt-0.5">
                Career GPS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/70 rounded-full border border-slate-200/80">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/recruiter-dashboard"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
            >
              Recruiter Portal
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
                  title="Open Dashboard"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold hidden md:inline truncate max-w-[100px]">
                    {user?.name || 'Dashboard'}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            )}

            {/* Mobile Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto lg:hidden mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 animate-fadeIn">
            <nav className="flex flex-col space-y-1">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
              >
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Dashboard</span>
              </Link>
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/recruiter-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <span>Recruiter Portal</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
