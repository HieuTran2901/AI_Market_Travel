import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShoppingCart, FileText, Zap, X, Lock } from 'lucide-react';
import { AuthReason } from '@/context/AuthenticationGateContext';
import authIllustration from '@/assets/images/AItravel.png';

interface AuthenticationRequiredModalProps {
  open: boolean;
  onClose: () => void;
  returnTo?: string;
  reason?: AuthReason;
}

export const AuthenticationRequiredModal: React.FC<AuthenticationRequiredModalProps> = ({
  open,
  onClose,
  returnTo,
  reason = 'protected-feature'
}) => {
  const navigate = useNavigate();

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/login', { state: { returnTo } });
  };

  const handleCreateAccount = () => {
    onClose();
    navigate('/register', { state: { returnTo } });
  };

  const getDescription = () => {
    if (reason === 'payment') {
      return "Please sign in to purchase AI Coins, complete payments, and access premium AI Travel Marketplace features.";
    }
    return "Please sign in to complete payments and access protected AI Travel Marketplace features.";
  };

  const features = [
    { icon: ShoppingCart, text: "Buy AI Coins instantly" },
    { icon: FileText, text: "Secure payment history" },
    { icon: ShieldCheck, text: "Exclusive member discounts" },
    { icon: Zap, text: "Faster checkout" }
  ];

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const modalVariants: any = {
    hidden: { opacity: 0, scale: 0.97, y: 8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.97, 
      y: -8,
      transition: { duration: 0.2 }
    }
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="relative w-full max-w-[840px] overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-[#0f172a] dark:border dark:border-slate-800"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/60 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close sign-in dialog"
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left Illustration */}
              <div className="md:w-[42%] h-[240px] md:h-auto shrink-0 relative bg-slate-100 dark:bg-slate-900">
                <img
                  src={authIllustration}
                  alt="AI Travel assistant holding an AI Coin beside travel luggage."
                  className="absolute inset-0 h-full w-full object-cover rounded-t-[24px] md:rounded-tr-none md:rounded-l-[24px]"
                />
              </div>

              {/* Right Content */}
              <div className="md:w-[58%] p-8 md:p-10 lg:p-12 flex flex-col justify-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-[13px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-400 mb-6">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Secure Access Required</span>
                  </div>

                  <h2 id="auth-modal-title" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                    Sign in to continue
                  </h2>
                  <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                    {getDescription()}
                  </p>

                  <ul className="space-y-4 mb-8">
                    {features.map((feature, i) => {
                      const Icon = feature.icon;
                      return (
                        <li key={i} className="flex items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                            {feature.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-3 mt-2">
                  <button
                    onClick={handleSignIn}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 transition-all dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800/50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    <span>Create Account</span>
                  </button>
                  
                  <div className="pt-2 text-center">
                    <button
                      onClick={onClose}
                      className="text-[14px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      Continue browsing
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Note */}
            <div className="bg-slate-50 px-6 py-4 dark:bg-[#090e17] border-t border-slate-100 dark:border-slate-800">
              <p className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Your information is protected with bank-level encryption.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
