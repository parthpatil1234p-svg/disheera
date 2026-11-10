import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Map, 
  Award, 
  FileText, 
  Briefcase, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'AI Diagnostic', path: '/assessment', icon: Sparkles },
    { name: 'Roadmap', path: '/roadmap', icon: Map },
    { name: 'Passport', path: '/passport', icon: Award },
    { name: 'Resume Studio', path: '/resume-builder', icon: FileText },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-[#0F172A] font-['Outfit']">
              Dishe<span className="text-[#2563EB]">era</span>
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] -mt-1 tracking-wider uppercase">
              Career GPS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action / Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/recruiter-dashboard"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center space-x-1.5 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Recruiter Portal</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pl-3 pr-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs uppercase">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-[#0F172A] leading-tight truncate max-w-[100px]">
                    {user.name || 'Candidate'}
                  </div>
                  <div className="text-[10px] text-[#64748B] leading-none">Student</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#E2E8F0] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-[#F1F5F9]">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/passport"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                  >
                    <Award className="w-4 h-4" />
                    <span>My Career Passport</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Dashboard GPS</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left border-t border-[#F1F5F9] mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                to="/assessment"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Free</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#475569] hover:bg-[#F1F5F9] transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  active
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[#F1F5F9] flex flex-col space-y-2">
            <Link
              to="/recruiter-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-50 text-[#475569] border border-[#E2E8F0]"
            >
              Recruiter Talent Cockpit
            </Link>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Sign Out ({user?.name})
              </button>
            ) : (
              <div className="flex space-x-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 py-2 text-center text-sm font-semibold border border-[#CBD5E1] rounded-xl text-[#334155]"
                >
                  Sign In
                </Link>
                <Link
                  to="/assessment"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 py-2 text-center text-sm font-semibold bg-[#2563EB] text-white rounded-xl"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
