import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setEmail('');
        setPassword('');
      }, 1600);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#f0eee9] border border-black/15 shadow-2xl rounded-2xl p-6 sm:p-8 text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="auth-dialog"
      >
        {/* Subtle halftone background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Close"
          id="close-auth-modal"
        >
          <X className="w-5 h-5 text-neutral-700" />
        </button>

        {isSuccess ? (
          <div className="relative py-8 flex flex-col items-center text-center animate-in zoom-in-95">
            <CheckCircle className="w-12 h-12 text-black mb-3" />
            <h3 className="text-xl font-bold font-sans tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Account Created'}
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              {mode === 'login'
                ? 'Authenticating your session with Nexora...'
                : 'Welcome to Nexora. Initializing workspace...'}
            </p>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Mode switch pills */}
            <div className="flex items-center p-1 bg-black/5 rounded-full mb-6 max-w-[210px]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Try Now
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-extrabold tracking-tight font-sans">
                {mode === 'login' ? 'Sign in to Nexora' : 'Start with Nexora'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                {mode === 'login'
                  ? 'Access your brand story assets and campaign models.'
                  : 'Start crafting digital stories that inspire action.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  id="auth-email-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  id="auth-password-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-full text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                id="auth-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Get Started'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
