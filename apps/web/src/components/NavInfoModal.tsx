import React from 'react';
import { X, ArrowUpRight } from 'lucide-react';

interface NavInfoModalProps {
  section: string | null;
  onClose: () => void;
  onGetInTouch: () => void;
}

export function NavInfoModal({ section, onClose, onGetInTouch }: NavInfoModalProps) {
  if (!section) return null;

  const contentMap: Record<string, { title: string; subtitle: string; points: { label: string; desc: string }[] }> = {
    Insights: {
      title: 'Digital Storytelling Insights',
      subtitle: 'Data-driven editorial strategies that turn brand identity into measurable market traction.',
      points: [
        {
          label: 'Brand Narrative Architecture',
          desc: 'Structuring resonant brand identities that cut through algorithmic noise.',
        },
        {
          label: 'Algorithmic Content Models',
          desc: 'High-leverage visual and narrative frameworks tested across multi-channel rollouts.',
        },
        {
          label: 'Action-Driven Conversion',
          desc: 'Synthesizing creative art direction with quantitative funnel performance.',
        },
      ],
    },
    Solutions: {
      title: 'Nexora Core Solutions',
      subtitle: 'End-to-end creative engineering for fast-growing companies and visionary enterprises.',
      points: [
        {
          label: 'Brand Strategy & Identity',
          desc: 'Complete visual systems, typographic hierarchies, and brand guideline frameworks.',
        },
        {
          label: 'Digital Product Experience',
          desc: 'World-class web applications, micro-interactions, and frictionless interfaces.',
        },
        {
          label: 'Editorial & Campaign Production',
          desc: 'High-impact multimedia launches, interactive editorial features, and visual direction.',
        },
      ],
    },
    Pricing: {
      title: 'Partnership Models',
      subtitle: 'Transparent, tailored collaboration structures designed for momentum and velocity.',
      points: [
        {
          label: 'Strategic Retainer',
          desc: 'Dedicated creative direction and digital storytelling execution month over month.',
        },
        {
          label: 'Sprint Engagements',
          desc: 'Targeted 4-to-8 week intensives for major rebrands, product rollouts, or campaign drops.',
        },
        {
          label: 'Enterprise Advisory',
          desc: 'High-level brand consulting and creative technology leadership for executive teams.',
        },
      ],
    },
  };

  const current = contentMap[section] || contentMap.Solutions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#f0eee9] border border-black/15 shadow-2xl rounded-2xl p-6 sm:p-8 text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="nav-info-dialog"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:6px_6px]" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Close"
          id="close-nav-info-modal"
        >
          <X className="w-5 h-5 text-neutral-700" />
        </button>

        <div className="relative z-10">
          <div className="mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nexora / {section}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans mt-1">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          <div className="space-y-3.5 my-6">
            {current.points.map((pt, i) => (
              <div key={i} className="p-3.5 bg-white/70 border border-black/10 rounded-xl">
                <h4 className="text-sm font-bold text-black">{pt.label}</h4>
                <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onGetInTouch();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all shadow-sm cursor-pointer"
              id="nav-modal-action-btn"
            >
              <span>Discuss {section}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-neutral-700 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
