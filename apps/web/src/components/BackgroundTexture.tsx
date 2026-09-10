import React from 'react';

/**
 * Fixed, full-viewport background: a pale ivory paper with a fine 24px graph-paper
 * grid. Sits at z-0 behind the page content; the hero art multiplies over it so
 * the grid keeps reading through the illustration like real gridded paper.
 */
export function BackgroundTexture() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none"
      style={{
        backgroundColor: '#fbf9ed',
        backgroundImage:
          'linear-gradient(to right, #d1cfc4 1px, transparent 1px), linear-gradient(to bottom, #d1cfc4 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0',
      }}
    />
  );
}
