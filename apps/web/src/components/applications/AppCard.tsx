import {
  Brain,
  Code,
  Gamepad2,
  Globe,
  GraduationCap,
  Info,
  Laptop,
  Server,
  Star,
  Video,
} from 'lucide-react';
import { type ComponentType, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Application, Category } from '@configshell/catalog';
import { gsap, useGSAP, prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

// Safe, generic per-category placeholders — unified with role-oriented filter chip navigation icons.
const CATEGORY_ICON: Record<Category, ComponentType<{ className?: string }>> = {
  General: Laptop,
  Student: GraduationCap,
  Developer: Code,
  'Web Developer': Globe,
  DevOps: Server,
  'Data & AI': Brain,
  'Content Creator': Video,
  Gaming: Gamepad2,
};

interface AppCardProps {
  app: Application;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpenDetails: (app: Application) => void;
}

export function AppCard({ app, selected, onToggle, onOpenDetails }: AppCardProps) {
  const Icon = CATEGORY_ICON[app.category];
  const inputId = `app-${app.id}`;
  const cardRef = useRef<HTMLLabelElement>(null);
  const prevSelectedRef = useRef(selected);

  useGSAP(
    () => {
      if (prefersReducedMotion() || prevSelectedRef.current === selected) {
        prevSelectedRef.current = selected;
        return;
      }
      prevSelectedRef.current = selected;

      if (!cardRef.current) return;

      if (selected) {
        gsap.fromTo(
          cardRef.current,
          { scale: 0.985 },
          {
            scale: 1,
            duration: MOTION_DURATIONS.micro,
            ease: MOTION_EASINGS.subtle,
            clearProps: 'transform',
          },
        );
      } else {
        gsap.fromTo(
          cardRef.current,
          { scale: 1.01 },
          {
            scale: 1,
            duration: MOTION_DURATIONS.micro,
            ease: MOTION_EASINGS.subtle,
            clearProps: 'transform',
          },
        );
      }
    },
    { dependencies: [selected], scope: cardRef },
  );

  return (
    <label
      ref={cardRef}
      htmlFor={inputId}
      className={cn(
        /*
         * Three named rows — header, text, metadata — so the parts line up
         * across the row of cards rather than each card distributing its own
         * leftover space. `1fr` on the text row is what pins the badges to the
         * bottom edge when one description is two lines and its neighbour's is
         * one. `relative` is for the checkbox's enlarged hit area, not layout.
         */
        'group relative grid cursor-pointer grid-rows-[auto_1fr_auto] gap-2 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-background select-none',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-foreground/25 hover:bg-muted/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'app-icon-badge flex size-7.5 shrink-0 items-center justify-center rounded-md transition-colors',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {/*
            Inside the label on purpose, so it stays within the card's hit area
            and tab order. preventDefault stops the click from also toggling the
            label's checkbox — without it, opening details would select the app.
          */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Details for ${app.name}`}
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenDetails(app);
            }}
          >
            <Info aria-hidden="true" className="size-3.5" />
          </Button>
          {/*
            The box stays 16px so the card's visual rhythm is unchanged, but
            the pseudo-element extends the *hit* area to 32x32. WCAG 2.5.8
            wants 24x24 minimum and the bare checkbox was 16x16.
          */}
          <Checkbox
            id={inputId}
            checked={selected}
            onCheckedChange={() => onToggle(app.id)}
            aria-label={`Select ${app.name}`}
            className="after:absolute after:-inset-2 after:content-['']"
          />
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium leading-tight">{app.name}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">{app.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] font-normal">{app.category}</Badge>
        {app.featured && (
          <Badge
            variant="secondary"
            className="gap-1 h-4.5 px-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 font-medium text-[10px]"
          >
            <Star aria-hidden="true" className="size-2.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
            Featured
          </Badge>
        )}
        {!app.featured && app.popularity !== undefined && app.popularity >= 90 && (
          <Badge
            variant="secondary"
            className="gap-1 h-4.5 px-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 font-medium text-[10px]"
          >
            <Star aria-hidden="true" className="size-2.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
            High Rated
          </Badge>
        )}
        {app.installation.length === 0 && (
          <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px]">No verified source</Badge>
        )}
      </div>
    </label>
  );
}
