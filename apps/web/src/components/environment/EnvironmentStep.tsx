import { DistroSelector } from './DistroSelector';
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
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <OsSelector />
        </div>
        <div className="lg:col-span-8">
          <DistroSelector selected={distro} onSelect={onSelect} />
        </div>
      </div>
    </section>
  );
}
