import { LinuxDetectionCard } from '@/components/detection/LinuxDetectionCard';
import { DistroSelector } from '@/components/distro/DistroSelector';
import { OsSelector } from './OsSelector';
import type { Distro } from '@configshell/catalog';

interface EnvironmentStepProps {
  distro: Distro | null;
  onSelect: (distro: Distro) => void;
}

/**
 * Step 1 — establish the environment (PRD §9 FR-001, §10).
 *
 * Detection and selection sit together on purpose. The browser signal is
 * genuinely weak — it can suggest "this looks like Linux" and nothing more —
 * so it is presented as a hint directly above the control that actually decides,
 * rather than as a result the user might mistake for a detected distribution.
 */
export function EnvironmentStep({ distro, onSelect }: EnvironmentStepProps) {
  return (
    <section aria-labelledby="environment-heading">
      <h2
        id="environment-heading"
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        1. Your environment
      </h2>

      <div className="mt-3">
        <LinuxDetectionCard />
      </div>

      <div className="mt-5 flex flex-col gap-6">
        <OsSelector />
        <DistroSelector selected={distro} onSelect={onSelect} />
      </div>
    </section>
  );
}
