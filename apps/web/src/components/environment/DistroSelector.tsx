import { Check } from 'lucide-react';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { DISTROS, type Distro } from './distros';
import { ecosystemForDistro } from '@configshell/catalog';
import { gsap, useGSAP, prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface DistroSelectorProps {
  selected: Distro | null;
  onSelect: (distro: Distro) => void;
}

export function DistroSelector({ selected, onSelect }: DistroSelectorProps) {
  const containerRef = useRef<HTMLFieldSetElement>(null);
  const prevSelectedRef = useRef<Distro | null>(selected);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !selected || prevSelectedRef.current === selected) {
        prevSelectedRef.current = selected;
        return;
      }
      prevSelectedRef.current = selected;

      const activeElement = containerRef.current?.querySelector('[data-distro-active="true"]');
      if (activeElement) {
        gsap.fromTo(
          activeElement,
          { scale: 0.985 },
          {
            scale: 1,
            duration: MOTION_DURATIONS.feedback,
            ease: MOTION_EASINGS.subtle,
            clearProps: 'transform',
          },
        );

        const checkIndicator = activeElement.querySelector('.distro-check-indicator');
        if (checkIndicator) {
          gsap.fromTo(
            checkIndicator,
            { scale: 0.5, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: MOTION_DURATIONS.micro,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform,opacity',
            },
          );
        }
      }
    },
    { dependencies: [selected], scope: containerRef },
  );

  return (
    <fieldset ref={containerRef}>
      <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Distribution
      </legend>

      <RadioGroup
        value={selected ?? undefined}
        onValueChange={(value) => onSelect(value as Distro)}
        className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-1.5"
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
              data-distro-active={active ? 'true' : 'false'}
              className={cn(
                'relative flex cursor-pointer flex-col justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-background select-none',
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-foreground/25 hover:bg-muted/30',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium truncate">{distro.name}</span>
                  <Badge variant="outline" className="h-3.5 px-1 font-mono text-[9px] font-normal">
                    {ecosystem}
                  </Badge>
                </div>
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
                    'distro-check-indicator flex size-3.5 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {active && <Check className="size-2.5" />}
                </span>
              </div>
              <span className="text-[10px] leading-tight text-muted-foreground truncate">
                {distro.description}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
