import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenTryNow: () => void;
  onSelectNav: (item: string) => void;
}

export function Header({ onOpenLogin, onOpenTryNow, onSelectNav }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ['Insights', 'Solutions', 'Pricing'];

  return (
    <header className="w-full relative z-30">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-24 pt-6 pb-4 sm:pt-7 sm:pb-5 flex items-center justify-between">
        {/* Left: Brand + Nav Links */}
        <div className="flex items-center gap-9 md:gap-12">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-baseline gap-0.5 text-black hover:opacity-90 transition-opacity select-none group"
            id="brand-logo"
          >
            <span className="font-extrabold text-[15px] sm:text-[17px] tracking-[0.14em] font-sans">
              NEXORA
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-black tracking-normal relative -top-1">
              ®
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8 text-neutral-800 font-normal text-[15px] tracking-normal">
            {navLinks.map((item) => (
              <button
                key={item}
                onClick={() => onSelectNav(item)}
                className="hover:text-black transition-colors cursor-pointer py-1 relative group"
                id={`nav-link-${item.toLowerCase()}`}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black transition-all duration-200 group-hover:w-full" />
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Login + Try Now */}
        <div className="hidden sm:flex items-center gap-6 md:gap-7">
          <button
            onClick={onOpenLogin}
            className="text-[15px] font-normal text-neutral-800 hover:text-black transition-colors cursor-pointer py-1"
            id="header-login-btn"
          >
            Login
          </button>
          <button
            onClick={onOpenTryNow}
            className="bg-black text-white px-5 py-2.5 rounded-full text-[14px] font-medium tracking-tight hover:bg-neutral-800 active:scale-95 transition-colors shadow-sm cursor-pointer"
            id="header-try-now-btn"
          >
            Try Now
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="sm:hidden flex items-center gap-3">
          <button
            onClick={onOpenTryNow}
            className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-medium"
            id="mobile-try-now-btn"
          >
            Try Now
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-black hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Toggle Menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-6 pt-2 pb-6 border-b border-black/10 bg-[#fbf9ed]/95 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <nav className="flex flex-col gap-3 py-3">
            {navLinks.map((item) => (
              <button
                key={item}
                onClick={() => {
                  onSelectNav(item);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-sm font-medium text-neutral-800 hover:text-black transition-colors"
              >
                {item}
              </button>
            ))}
            <div className="pt-3 border-t border-black/10 flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-medium text-neutral-800"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onOpenTryNow();
                  setMobileMenuOpen(false);
                }}
                className="bg-black text-white px-5 py-2 rounded-full text-xs font-medium"
              >
                Try Now
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
