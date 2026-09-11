import { Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { DISTROS, type Distro } from '@/data/distros';

interface DistroSelectorProps {
  selected: Distro | null;
  onSelect: (distro: Distro) => void;
}

export function DistroSelector({ selected, onSelect }: DistroSelectorProps) {
  return (
    <section aria-labelledby="distro-heading">
      <h2 id="distro-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        1. Choose your distribution
      </h2>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        Browsers can't reliably identify your exact Linux distribution, so pick it manually.
      </p>

      <RadioGroup
        value={selected ?? undefined}
        onValueChange={(value) => onSelect(value as Distro)}
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {DISTROS.map((distro) => {
          const active = selected === distro.name;
          const inputId = `distro-${distro.name}`;
          return (
            <label
              key={distro.name}
              htmlFor={inputId}
              className={cn(
                'relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors',
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-foreground/25',
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-medium">{distro.name}</span>
                <RadioGroupItem value={distro.name} id={inputId} className="sr-only" />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{distro.description}</span>
            </label>
          );
        })}
      </RadioGroup>
    </section>
  );
}
