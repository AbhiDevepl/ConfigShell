import { DistroSelector } from './DistroSelector';
import { LinuxDetectionCard } from './LinuxDetectionCard';
import { OsSelector } from './OsSelector';
import type { Distro } from '@configshell/catalog';

interface EnvironmentStepProps {
  distro: Distro | null;
  onSelect: (distro: Distro) => void;
}

/**
 * Environment establishment — choose distribution and environment.
 */
export function EnvironmentStep({ distro, onSelect }: EnvironmentStepProps) {
  return (
    <section aria-label="Environment selection">
      {/*
        The browser's own signal, first: it answers "am I even on Linux" before
        the user is asked to name a distribution. It is a hint and says so —
        the choice below is always explicit, because a browser cannot identify
        a distribution (see useLinuxDetection).
      */}
      <div className="mb-2.5">
        <LinuxDetectionCard />
      </div>

      {/*
        Stacked until there is room, then two tracks sized by what they hold
        rather than by a 12-column scaffold: the OS list is three fixed choices,
        the distribution list is longer and takes the rest.
      */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)] lg:items-start">
        <OsSelector />
        <DistroSelector selected={distro} onSelect={onSelect} />
      </div>
    </section>
  );
}
