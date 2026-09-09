import React from 'react';

/**
 * Full-bleed "Creation of Adam" style illustration: a cybernetic hand reaching
 * in from the left toward a human hand reaching in from the right. The source
 * artwork sits on a paper-cream background, so `mix-blend-multiply` lets its
 * halftone ink merge into the page texture with no visible image edge.
 */
export function HandsIllustration() {
  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="relative w-full aspect-[16/11] sm:aspect-[16/7] md:aspect-[16/5] lg:aspect-[9/2]">
        <img
          src="/creation_adam.jpg"
          alt="A robotic cybernetic hand and a human hand reaching toward one another in the Creation of Adam pose, rendered as a black-and-white halftone illustration"
          className="absolute inset-0 h-full w-full object-cover object-[50%_60%] mix-blend-multiply contrast-[1.1] brightness-[0.99]"
          draggable={false}
          referrerPolicy="no-referrer"
          id="creation-of-adam-hands"
        />
      </div>
    </div>
  );
}
