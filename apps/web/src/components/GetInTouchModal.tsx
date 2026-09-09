import React, { useState } from 'react';
import { X, CheckCircle, ArrowUpRight, Loader2 } from 'lucide-react';

interface GetInTouchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GetInTouchModal({ isOpen, onClose }: GetInTouchModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        setName('');
        setEmail('');
        setCompany('');
        setMessage('');
      }, 2000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#f0eee9] border border-black/15 shadow-2xl rounded-2xl p-6 sm:p-8 text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="get-in-touch-dialog"
      >
        {/* Subtle internal halftone grain pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Close"
          id="close-contact-modal"
        >
          <X className="w-5 h-5 text-neutral-700" />
        </button>

        {isSuccess ? (
          <div className="relative py-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <CheckCircle className="w-12 h-12 text-black mb-4" />
            <h3 className="text-2xl font-bold font-sans tracking-tight">Message Received</h3>
            <p className="mt-2 text-sm text-neutral-600 max-w-sm">
              Thank you for reaching out to Nexora. Our creative team will review your inquiry and connect with you shortly.
            </p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Inquiry</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans mt-1">
                Start With Vision.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1.5">
                Tell us about your brand, challenges, and goals.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  id="contact-name-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@company.com"
                    className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    id="contact-email-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Studio / Brand"
                    className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    id="contact-company-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Project Scope & Vision</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share what you are looking to create or transform..."
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-black/15 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                  id="contact-message-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-full text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                id="contact-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Inquiry</span>
                    <ArrowUpRight className="w-4 h-4" />
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
