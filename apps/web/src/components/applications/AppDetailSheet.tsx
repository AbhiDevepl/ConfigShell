import { CheckCircle2, ExternalLink, Package, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  ecosystemForDistro,
  type Application,
  type Distro,
  type InstallationSource,
  type RepositoryOrigin,
} from '@configshell/catalog';

/**
 * What `distro` / `vendor` / `community` actually mean, in the user's terms.
 *
 * This distinction is the catalog's main contribution to trust, and it is
 * useless if it only ever appears as an unexplained word. A reverse-DNS Flatpak
 * id like `com.google.Chrome` looks official and often is not.
 */
const ORIGIN_INFO: Record<
  RepositoryOrigin,
  { label: string; meaning: string; icon: ComponentType<{ className?: string }>; tone: string }
> = {
  distro: {
    label: 'Distribution',
    meaning: "Ships in your distribution's own repositories, maintained by the distribution.",
    icon: ShieldCheck,
    tone: 'text-primary',
  },
  vendor: {
    label: 'Vendor',
    meaning: 'Published by the people who make the application.',
    icon: ShieldCheck,
    tone: 'text-foreground',
  },
  community: {
    label: 'Community',
    meaning:
      'Packaged by a third party, not by the vendor. Usually fine, but the vendor does not stand behind it.',
    icon: ShieldQuestion,
    tone: 'text-muted-foreground',
  },
};

interface AppDetailSheetProps {
  app: Application | null;
  /** Null until a distribution is chosen — availability is relative to one. */
  distro: Distro | null;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-application detail (PRD §12, ROADMAP "Application details").
 *
 * Shows every verified source and, once a distribution is chosen, which ones
 * apply to it. It deliberately does **not** duplicate the resolver's choice:
 * the setup plan is the single place that says "this is what will be used and
 * why", and a second, subtly different answer here would be worse than none.
 * What this view adds is provenance — who packaged each route.
 */
export function AppDetailSheet({
  app,
  distro,
  selected,
  onToggle,
  onOpenChange,
}: AppDetailSheetProps) {
  return (
    <Sheet open={app !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {app && (
          <>
            <SheetHeader>
              <SheetTitle>{app.name}</SheetTitle>
              <SheetDescription>{app.description}</SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{app.category}</Badge>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href={app.homepage} target="_blank" rel="noreferrer noopener">
                    Homepage
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                </Button>
              </div>

              <Button
                type="button"
                variant={selected ? 'outline' : 'default'}
                onClick={() => onToggle(app.id)}
              >
                {selected ? 'Remove from selection' : 'Add to selection'}
              </Button>

              <Separator />

              <section aria-labelledby="sources-heading">
                <h3 id="sources-heading" className="text-sm font-medium">
                  Verified installation sources
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {distro
                    ? `Highlighted rows apply to ${distro}. Which one ConfigShell actually uses is decided in the setup plan.`
                    : 'Choose a distribution to see which of these apply to you.'}
                </p>

                {app.installation.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    No installation source has been verified for this application yet. That
                    means nothing has been checked — not that it cannot be installed.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {app.installation.map((source) => (
                      <SourceRow
                        key={`${source.method}:${source.identifier}`}
                        source={source}
                        appliesHere={distro ? sourceAppliesTo(source, distro) : null}
                      />
                    ))}
                  </ul>
                )}
              </section>

              {app.verify && (
                <section aria-labelledby="verify-heading">
                  <h3 id="verify-heading" className="flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
                    How it is verified
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    After installing, ConfigShell checks that{' '}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono">
                      {app.verify.binary}
                    </code>{' '}
                    is on your <code className="font-mono">PATH</code>.
                  </p>
                </section>
              )}

              <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                ConfigShell never installs anything itself. It produces commands you run in
                your own terminal.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Does this source apply to the chosen distribution? */
function sourceAppliesTo(source: InstallationSource, distro: Distro): boolean {
  if (source.method === 'flatpak' || source.method === 'snap' || source.method === 'official') {
    return true; // distribution-agnostic by design
  }
  return source.method === ecosystemForDistro(distro) && (source.distros?.includes(distro) ?? false);
}

function SourceRow({
  source,
  appliesHere,
}: {
  source: InstallationSource;
  appliesHere: boolean | null;
}) {
  const origin = ORIGIN_INFO[source.origin];
  const OriginIcon = origin.icon;
  // A package-manager route with a vendor origin lives in the vendor's own
  // repository, which ConfigShell will not add for you.
  const needsRepoSetup =
    source.origin === 'vendor' && ['apt', 'dnf', 'pacman'].includes(source.method);

  return (
    <li
      className={cn(
        'rounded-lg border p-3',
        appliesHere === false ? 'border-border bg-muted/30 opacity-60' : 'border-border bg-card',
        appliesHere === true && 'border-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm">
            <Package aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-mono text-xs break-all">{source.identifier}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            via <span className="font-medium">{source.method}</span>
            {source.distros && ` · ${source.distros.join(', ')}`}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          <OriginIcon aria-hidden="true" className={cn('size-3', origin.tone)} />
          {origin.label}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{origin.meaning}</p>

      {needsRepoSetup && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Lives in the vendor's own repository, which has to be added to your system first.
            ConfigShell does not generate repository-setup commands, so it will point you at
            the vendor's instructions instead.
          </span>
        </p>
      )}

      {source.url && (
        <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
          <a href={source.url} target="_blank" rel="noreferrer noopener">
            {source.method === 'official' ? 'Download page' : 'Setup instructions'}
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </Button>
      )}
    </li>
  );
}
