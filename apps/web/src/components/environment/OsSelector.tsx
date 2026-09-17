import { Check, Info } from 'lucide-react';
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
      <legend className="text-sm font-medium">Operating system</legend>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPERATING_SYSTEMS.map((os) => (
          <div
            key={os.id}
            aria-current={os.supported ? 'true' : undefined}
            className={cn(
              'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3',
              os.supported
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-muted/40',
            )}
          >
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-medium',
                  !os.supported && 'text-muted-foreground',
                )}
              >
                {os.name}
              </span>
              <span className="block text-xs text-balance text-muted-foreground">{os.note}</span>
            </span>

            {os.supported ? (
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
              </span>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Not yet
              </Badge>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Linux is the only supported platform today, so it is selected for you. macOS and
          Windows are on the roadmap and have no catalog data yet.
        </span>
      </p>
    </fieldset>
  );
}
