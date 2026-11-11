import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccessMsg(`Password reset code dispatched to ${email}. Check your inbox.`);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset code. Please ensure your email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setSuccessMsg('Your password has been successfully reset! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FD] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <img src="/logo.svg" alt="Disheera Logo" className="w-11 h-11 object-contain transition-transform group-hover:scale-105" />
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">Disheera</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {step === 'request' ? 'Reset Your Password' : 'Enter Reset Code & New Password'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {step === 'request'
            ? 'We will send a 6-digit recovery code to your registered email'
            : 'Enter the 6-digit code and choose a strong new password'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Send Reset Code</span>
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 font-mono font-bold tracking-widest bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Update Password</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Did not get code? Request again
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
