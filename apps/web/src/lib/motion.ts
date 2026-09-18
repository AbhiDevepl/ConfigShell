/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins once at application module scope.
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };

/**
 * Standard duration tokens (in seconds) for ConfigShell.
 * ConfigShell is a developer utility: motion must be fast, precise, and subtle.
 *
 * Guideline ranges:
 * - micro / feedback: 150ms – 250ms (0.15s – 0.25s)
 * - component / reveal: 250ms – 350ms (0.25s – 0.35s)
 * - section / page transition: 300ms – 500ms (0.3s – 0.5s)
 */
export const MOTION_DURATIONS = {
  instant: 0,
  micro: 0.18,
  feedback: 0.22,
  normal: 0.28,
  reveal: 0.35,
  section: 0.45,
} as const;

/**
 * Standard easing curves.
 * Smooth deceleration without bounce or elastic exaggeration.
 */
export const MOTION_EASINGS = {
  subtle: 'power2.out',
  inOut: 'power2.inOut',
  quick: 'power1.out',
} as const;

/**
 * Checks if the user prefers reduced motion.
 * Respects OS/browser accessibility preferences.
 * Safe for SSR (defaults to true if window is undefined).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Whether an *entrance* animation should be skipped outright.
 *
 * Reduced motion is the accessibility half. `document.hidden` is the other
 * half, and it is a correctness one: an entrance is a `fromTo` that applies
 * `opacity: 0` synchronously, and GSAP's ticker runs on requestAnimationFrame,
 * which a background tab does not fire. Starting one while the tab is hidden
 * therefore paints the content invisible and leaves it that way until the tab
 * is focused — the build view returning from the plan view goes to opacity 0
 * and stays there, which is how this was found.
 *
 * Nobody can watch an animation in a hidden tab, so there is nothing to lose
 * by skipping it: the content simply renders at its natural opacity.
 *
 * Use this for anything that *reveals* content. Feedback animations for a
 * click or a selection change do not need it — a user interacting with the
 * page is by definition looking at it.
 */
export function shouldSkipEntrance(): boolean {
  return prefersReducedMotion() || (typeof document !== 'undefined' && document.hidden);
}
