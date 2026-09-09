import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface HeroProps {
  onGetInTouch: () => void;
}

export function Hero({ onGetInTouch }: HeroProps) {
  return (
    <section className="relative z-20 pt-5 sm:pt-6 md:pt-7 pb-1 text-center px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Main Headline */}
        <h1
          className="text-[42px] sm:text-[58px] md:text-[66px] lg:text-[74px] xl:text-[76px] font-extrabold text-black tracking-[-0.005em] leading-[0.9] text-center select-none"
          style={{
            fontFamily: '"Barlow Condensed", "Barlow Semi Condensed", "Inter Tight", sans-serif',
          }}
          id="hero-heading"
        >
          Bold Ideas That<br />
          Start With Vision.
        </h1>

        {/* Subtitle */}
        <p
          className="mt-3 text-[13.5px] sm:text-[14.5px] md:text-[15px] text-neutral-700 font-normal leading-[1.55] max-w-md text-center"
          id="hero-subheading"
        >
          We help modern brands craft digital stories that<br className="hidden sm:inline" /> inspire action and drive results.
        </p>

        {/* CTA Button */}
        <div className="mt-4">
          <button
            onClick={onGetInTouch}
            className="group inline-flex items-center justify-center gap-1.5 bg-black text-white px-7 py-3 rounded-full text-[14px] font-medium tracking-normal hover:bg-neutral-800 active:scale-95 transition-colors shadow-sm cursor-pointer"
            id="hero-cta-btn"
          >
            <span>Get In Touch</span>
            <ArrowUpRight className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>
    </section>
  );
}
