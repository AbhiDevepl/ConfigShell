import { CheckCircle2, HandMetal, Info, ShieldAlert, type LucideIcon } from 'lucide-react';

/**
 * What can happen to one selected application, and how it is presented.
 *
 * The first three mirror the resolver's own outcomes (`resolved`, `manual`,
 * `unavailable` — see `@configshell/installer`). `privileged` is not an outcome
 * but a property of a generated command, and it is here because it is the
 * fourth thing this screen has to distinguish at a glance.
 *
 * ## Why one map
 *
 * Status styling was previously chosen per component — a `text-primary` here,
 * a `variant="destructive"` there, an outline badge somewhere else — so the
 * same concept looked different in three places and nothing stopped a fourth
 * from inventing a fifth appearance. Presentation lives here; components read
 * it.
 *
 * ## Colour is never the only signal
 *
 * Every entry carries a `label` and an `Icon` alongside its colour token. A
 * status is always rendered with at least its label, so the distinction
 * survives greyscale, colour blindness, and a screen reader — none of which
 * can see a token.
 */
export type PlanOutcome = 'installable' | 'manual' | 'unavailable' | 'privileged';

export interface OutcomePresentation {
  /** Short enough for a badge or a summary tile. Always rendered. */
  label: string;
  /** One sentence a user can act on, for headings and empty states. */
  description: string;
  Icon: LucideIcon;
  /** Foreground utility, from the `--outcome-*` tokens in `index.css`. */
  text: string;
  /** Border utility for cards and command blocks, at low opacity. */
  border: string;
}

export const OUTCOMES: Record<PlanOutcome, OutcomePresentation> = {
  installable: {
    label: 'Installable',
    description: 'ConfigShell generated a command for this. You run it.',
    Icon: CheckCircle2,
    text: 'text-outcome-installable',
    border: 'border-outcome-installable/30',
  },
  manual: {
    label: 'Manual step',
    description: 'You install this one yourself, from the vendor.',
    Icon: HandMetal,
    text: 'text-outcome-manual',
    border: 'border-outcome-manual/30',
  },
  unavailable: {
    label: 'Unavailable',
    description: 'No verified route on this distribution.',
    Icon: Info,
    text: 'text-outcome-unavailable',
    border: 'border-outcome-unavailable/30',
  },
  privileged: {
    // Not "sudo": the web source may not contain package-manager command
    // vocabulary, and `src/lib/safety.test.ts` fails the build if it does.
    // "Root" is the word the rest of this screen already uses.
    label: 'Runs as root',
    description: 'Requires elevated privileges. ConfigShell never asks for a password.',
    Icon: ShieldAlert,
    text: 'text-outcome-privileged',
    border: 'border-outcome-privileged/30',
  },
};

/**
 * How much of the selection produced a command, from the canonical plan.
 *
 * Mirrors `SetupPlan['status']` from the API rather than re-deriving it from
 * the counts — the server decides this, the same way it decides everything
 * else on this screen.
 */
export const PLAN_STATUS = {
  complete: {
    title: 'Everything you selected can be installed',
    tone: 'text-outcome-installable',
    Icon: CheckCircle2,
  },
  partial: {
    title: 'Some of your selection needs you',
    tone: 'text-outcome-manual',
    Icon: Info,
  },
  none: {
    title: 'No commands for this selection',
    tone: 'text-outcome-unavailable',
    Icon: Info,
  },
} as const;
