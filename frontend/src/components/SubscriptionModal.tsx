import React, { useState } from 'react';
import { 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  X, 
  ArrowRight, 
  Loader2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentDaysRemaining?: number;
  isPro?: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentDaysRemaining = 0,
  isPro = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Ensure Razorpay SDK script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay Payment Gateway SDK failed to load. Please check your network connection.');
      }

      // 2. Create order on backend via Razorpay
      const res = await api.post('/payments/create-order', {
        amount: 499,
        planName: 'Pro Career Accelerator'
      });

      if (!res || !res.success || !res.data) {
        throw new Error(res?.message || 'Could not initiate payment order.');
      }

      const { orderId, amount, keyId, userName, userEmail, userPhone } = res.data;

      if (!orderId) {
        throw new Error('Payment order could not be established.');
      }

      // 3. Launch Razorpay Standard Web Checkout Modal
      const options = {
        key: keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_live_Tzl9Yoenjvn6Nn',
        amount: amount || 49900,
        currency: 'INR',
        name: 'Disheera Technologies Inc.',
        description: 'Pro Career Accelerator (30 Days)',
        image: '/client/assets/brand/disheera_icon_256.png',
        order_id: orderId,
        prefill: {
          name: userName || '',
          email: userEmail || '',
          contact: userPhone || ''
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          backdropclose: false,
          ondismiss: () => {
            setLoading(false);
          }
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            if (verifyRes && verifyRes.success) {
              if (onSuccess) onSuccess();
              onClose();
            } else {
              setError(verifyRes?.message || 'Payment confirmation pending. Please check again in a moment.');
            }
          } catch (vErr: any) {
            console.error('Signature verification error:', vErr);
            setError(vErr.message || 'Payment verification could not be confirmed.');
          } finally {
            setLoading(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', (failRes: any) => {
        console.error('Razorpay payment failed:', failRes.error);
        setError(failRes.error?.description || 'Payment was cancelled or could not be completed.');
        setLoading(false);
      });

      rzpInstance.open();

    } catch (err: any) {
      console.error('Payment checkout failed:', err);
      setError(err.message || 'An unexpected error occurred while starting checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-6 sm:px-8 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Disheera Premium Membership</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] leading-tight">
            Pro Career Accelerator
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Empirical skills, voice viva proctoring & direct placement routing.
          </p>

          {isPro && currentDaysRemaining > 0 && (
            <div className="mt-3 inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Active Plan: {currentDaysRemaining} days remaining (Extends by 30 days)</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Pricing Box */}
          <div className="flex items-baseline justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Subscription Fee</div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-3xl font-extrabold text-[#0F172A] font-['Outfit']">₹499</span>
                <span className="text-xs text-[#64748B] font-semibold">/ 30 Days</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Save 60%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#64748B]">All Taxes Included</div>
              <div className="text-xs font-bold text-[#2563EB] flex items-center justify-end space-x-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Pro Activation</span>
              </div>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Everything Included In Pro:</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#334155]">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>16-Week Sprints</strong> with automated code grading</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Voice AI Viva</strong> oral defense proctoring</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>SHA-256 Merit Passport</strong> cryptographic proof</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Enterprise Recruiter Radar</strong> direct job routing</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>WhatsApp Telemetry</strong> automated streak alerts</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>ATS LaTeX Resumes</strong> with live QR verification</span>
              </div>
            </div>
          </div>

          {/* Security & Payment Rail Notice */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by <strong>Razorpay Payment Gateway (Live)</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">UPI · Cards · NetBanking · Wallets</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm sm:text-base transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting to Razorpay...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current text-amber-300" />
                <span>{isPro ? 'Extend Pro Membership (₹499)' : 'Upgrade to Pro for ₹499'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
