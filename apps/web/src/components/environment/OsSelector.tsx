import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Operating-system selection (PRD §10).
 *
 * macOS and Windows are shown and are **visibly unsupported** rather than
 * hidden. The PRD plans for them, and a user on one deserves to be told "not
 * yet" rather than left wondering whether they missed an option. Nothing in the
 * catalog carries data for them, so selecting one is not possible.
 */
const OPERATING_SYSTEMS = [
  { id: 'linux', name: 'Linux', supported: true, note: 'APT · DNF · pacman · Flatpak · Snap' },
  { id: 'macos', name: 'macOS', supported: false, note: 'Homebrew — planned' },
  { id: 'windows', name: 'Windows', supported: false, note: 'WinGet · Scoop — planned' },
] as const;

export function OsSelector() {
  return (
    <fieldset>
      <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Operating system
      </legend>

      <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-1.5">
        {OPERATING_SYSTEMS.map((os) => (
          <div
            key={os.id}
            aria-current={os.supported ? 'true' : undefined}
            className={cn(
              'flex flex-col justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
              os.supported
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-muted/30 opacity-75',
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  'font-medium text-xs',
                  !os.supported && 'text-muted-foreground',
                )}
              >
                {os.name}
              </span>

              {os.supported ? (
                <span
                  aria-hidden="true"
                  className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground"
                >
                  <Check className="size-2.5" />
                </span>
              ) : (
                <Badge variant="secondary" className="h-4 px-1 text-[9px] shrink-0 font-normal">
                  Planned
                </Badge>
              )}
            </div>
            <span className="block truncate text-[10px] text-muted-foreground">{os.note}</span>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
