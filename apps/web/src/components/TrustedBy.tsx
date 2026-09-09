import React from 'react';
import {
  MercuryLogo,
  RampLogo,
  HexLogo,
  VercelLogo,
  DescriptLogo,
  CashAppLogo,
  SupercellLogo,
  RunwayLogo,
} from './Logos';

export function TrustedBy() {
  return (
    <section className="relative z-20 pt-4 pb-7 sm:pb-8 text-center px-4">
      <div className="max-w-6xl mx-auto">
        {/* Caption */}
        <p className="text-xs sm:text-[13px] text-neutral-600 font-normal tracking-tight mb-5 sm:mb-6 select-none">
          Trusted by teams of every scale
        </p>

        {/* Logos container */}
        <div className="w-full overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center justify-center min-w-max md:min-w-0 flex-wrap gap-x-8 gap-y-5 sm:gap-x-10 md:gap-x-9 lg:gap-x-11 px-2">
            <MercuryLogo />
            <RampLogo />
            <HexLogo />
            <VercelLogo />
            <DescriptLogo />
            <CashAppLogo />
            <SupercellLogo />
            <RunwayLogo />
          </div>
        </div>
      </div>
    </section>
  );
}
