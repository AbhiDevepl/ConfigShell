import React from 'react';

export function MercuryLogo() {
  return (
    <div className="flex items-center gap-2 text-black hover:opacity-80 transition-opacity cursor-pointer">
      <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9.5" />
        <ellipse cx="12" cy="12" rx="4.5" ry="9.5" />
        <line x1="2.5" y1="12" x2="21.5" y2="12" />
        <path d="M4 7.5h16M4 16.5h16" strokeWidth="1.2" />
      </svg>
      <span className="font-semibold text-xs sm:text-[13px] tracking-[0.16em] uppercase">MERCURY</span>
    </div>
  );
}

export function RampLogo() {
  return (
    <div className="flex items-center gap-1.5 text-black hover:opacity-80 transition-opacity cursor-pointer">
      <span className="font-bold text-sm sm:text-base tracking-tight font-sans">ramp</span>
      {/* Ramp right-angled triangle wedge icon */}
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" viewBox="0 0 16 16" fill="currentColor">
        <polygon points="1,15 15,15 15,1" />
      </svg>
    </div>
  );
}

export function HexLogo() {
  return (
    <div className="flex items-center text-black hover:opacity-80 transition-opacity cursor-pointer">
      <span className="font-black text-sm sm:text-base tracking-[0.12em] font-mono leading-none">
        HEX
      </span>
    </div>
  );
}

export function VercelLogo() {
  return (
    <div className="flex items-center gap-1.5 text-black hover:opacity-80 transition-opacity cursor-pointer">
      <svg className="w-3.5 h-3 sm:w-4 sm:h-3.5" viewBox="0 0 24 20" fill="currentColor">
        <polygon points="12,0 24,20 0,20" />
      </svg>
      <span className="font-semibold text-xs sm:text-[14px] tracking-tight">Vercel</span>
    </div>
  );
}

export function DescriptLogo() {
  return (
    <div className="flex items-center gap-1.5 text-black hover:opacity-80 transition-opacity cursor-pointer">
      {/* Speech bubble with waveform bars */}
      <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <line x1="8.5" y1="11.5" x2="8.5" y2="12.5" strokeLinecap="round" strokeWidth="2.5" />
        <line x1="12" y1="9.5" x2="12" y2="14.5" strokeLinecap="round" strokeWidth="2.5" />
        <line x1="15.5" y1="10.5" x2="15.5" y2="13.5" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
      <span className="font-semibold text-xs sm:text-[14px] tracking-tight">descript</span>
    </div>
  );
}

export function CashAppLogo() {
  return (
    <div className="flex items-center gap-1.5 text-black hover:opacity-80 transition-opacity cursor-pointer">
      <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] bg-black rounded-[4px] flex items-center justify-center text-white font-bold text-[10px] sm:text-[11px] leading-none">
        $
      </div>
      <span className="font-semibold text-xs sm:text-[14px] tracking-tight">Cash App</span>
    </div>
  );
}

export function SupercellLogo() {
  return (
    <div className="flex items-center text-black hover:opacity-80 transition-opacity cursor-pointer">
      <div className="text-[7.5px] sm:text-[8.5px] font-black leading-[1.0] tracking-widest text-center border-black select-none">
        <div>SUP</div>
        <div>ERC</div>
        <div>ELL</div>
      </div>
    </div>
  );
}

export function RunwayLogo() {
  return (
    <div className="flex items-center gap-1.5 text-black hover:opacity-80 transition-opacity cursor-pointer">
      <svg className="w-4 h-4 sm:w-[17px] sm:h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <path d="M8 7v10M8 7h4a2.5 2.5 0 0 1 0 5H8M11.5 12l4 5" />
      </svg>
      <span className="font-semibold text-xs sm:text-[14px] tracking-tight">runway</span>
    </div>
  );
}
