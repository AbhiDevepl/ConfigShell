import React from 'react';

export function BackgroundTexture() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Base Halftone Stipple Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-45" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="halftone-dots" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="0.7" fill="#000000" fillOpacity="0.32" />
          </pattern>
          <pattern id="halftone-dots-sparse" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.1" fill="#000000" fillOpacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#halftone-dots)" />
        <rect width="100%" height="100%" fill="url(#halftone-dots-sparse)" />
      </svg>

      {/* SVG Paper Grain Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-25 mix-blend-multiply" xmlns="http://www.w3.org/2000/svg">
        <filter id="vintage-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#vintage-grain)" />
      </svg>

      {/* Subtle vignette along border edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.06)_100%)] pointer-events-none" />
    </div>
  );
}
