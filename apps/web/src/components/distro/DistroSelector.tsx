import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { DISTROS, type Distro } from '@/data/distros';
import { ecosystemForDistro } from '@configshell/catalog';

interface DistroSelectorProps {
  selected: Distro | null;
  onSelect: (distro: Distro) => void;
}

export function DistroSelector({ selected, onSelect }: DistroSelectorProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Distribution</legend>
      <p className="mt-1 max-w-prose text-xs text-muted-foreground">
        Browsers can't reliably identify your exact Linux distribution, so pick it manually.
        It decides which package manager your commands use.
      </p>

      <RadioGroup
        value={selected ?? undefined}
        onValueChange={(value) => onSelect(value as Distro)}
        className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {DISTROS.map((distro) => {
          const active = selected === distro.name;
          const inputId = `distro-${distro.name}`;
          // Derived from the catalog, never written down twice here.
          const ecosystem = ecosystemForDistro(distro.name);
          return (
            <label
              key={distro.name}
              htmlFor={inputId}
              className={cn(
                'relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-foreground/25',
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-medium">{distro.name}</span>
                {/*
                  aria-label is required, not belt-and-braces: Radix renders this
                  as <button role="radio">, and a <label for> names form controls,
                  not buttons. Without it a screen reader announces four unnamed
                  radios.
                */}
                <RadioGroupItem
                  value={distro.name}
                  id={inputId}
                  aria-label={`${distro.name} (${ecosystem})`}
                  className="sr-only"
                />
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
              <Badge variant="outline" className="w-fit font-mono text-[0.7rem]">
                {ecosystem}
              </Badge>
              <span className="text-xs leading-snug text-muted-foreground">{distro.description}</span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
