import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Loader2,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Star,
} from 'lucide-react';
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
import { useApplicationResolution } from '@/hooks/useApplicationResolution';
import type { ConsideredSource } from '@/lib/api';
import type {
  Application,
  Distro,
  InstallationSource,
  RepositoryOrigin,
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
 * Shows every verified source with its provenance — who packaged each route —
 * and, once a distribution is chosen, **the resolver's own answer** about which
 * ones apply and which would be used.
 *
 * That answer is fetched rather than computed. Applicability is resolver policy,
 * including rules this screen has no business knowing (a vendor package-manager
 * source needs a repository added first and so is not usable). An earlier version
 * re-derived it locally and disagreed with the plan.
 */
export function AppDetailSheet({
  app,
  distro,
  selected,
  onToggle,
  onOpenChange,
}: AppDetailSheetProps) {
  const { status, resolution, error } = useApplicationResolution(app?.id ?? null, distro);

  /** The resolver's verdict on one source, once it has arrived. */
  const consideredFor = (source: InstallationSource): ConsideredSource | null =>
    resolution?.considered.find(
      (candidate) =>
        candidate.method === source.method && candidate.identifier === source.identifier,
    ) ?? null;

  /** Is this the source the resolver would actually use? */
  const isChosen = (source: InstallationSource): boolean =>
    resolution?.outcome === 'resolved' &&
    resolution.source?.method === source.method &&
    resolution.source?.identifier === source.identifier;

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
                {app.featured && (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 font-medium"
                  >
                    <Star aria-hidden="true" className="size-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                    Featured
                  </Badge>
                )}
                {!app.featured && app.popularity !== undefined && app.popularity >= 90 && (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 font-medium"
                  >
                    <Star aria-hidden="true" className="size-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                    High Rated
                  </Badge>
                )}
                {app.popularity !== undefined && (
                  <Badge variant="outline" className="text-muted-foreground font-normal">
                    {app.popularity}% Popularity
                  </Badge>
                )}
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
                <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                  {!distro
                    ? 'Choose a distribution to see which of these apply to you.'
                    : status === 'loading'
                      ? `Checking which apply to ${distro}…`
                      : status === 'ready'
                        ? `Highlighted rows can be used on ${distro}.`
                        : `Showing every verified source. Availability for ${distro} could not be checked.`}
                </p>

                {status === 'loading' && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                    Asking ConfigShell which sources apply
                  </p>
                )}

                {status === 'error' && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {error?.kind === 'offline'
                        ? "The ConfigShell API isn't reachable, so which sources apply here can't be checked. The sources themselves are still listed."
                        : 'Could not check which sources apply here. The sources themselves are still listed.'}
                    </span>
                  </p>
                )}

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
                        considered={consideredFor(source)}
                        chosen={isChosen(source)}
                      />
                    ))}
                  </ul>
                )}

                {status === 'ready' && resolution && (
                  <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    {resolution.outcome === 'resolved'
                      ? resolution.reason
                      : (resolution.explanation ?? resolution.reason)}
                  </p>
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

function SourceRow({
  source,
  considered,
  chosen,
}: {
  source: InstallationSource;
  /** The resolver's verdict, or null before it arrives / if it could not be fetched. */
  considered: ConsideredSource | null;
  chosen: boolean;
}) {
  const origin = ORIGIN_INFO[source.origin];
  const OriginIcon = origin.icon;
  const eligible = considered?.eligible ?? null;

  return (
    <li
      className={cn(
        'rounded-lg border p-3',
        eligible === false ? 'border-border bg-muted/30 opacity-60' : 'border-border bg-card',
        eligible === true && 'border-primary/40',
        chosen && 'border-primary ring-1 ring-primary',
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
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="outline">
            <OriginIcon aria-hidden="true" className={cn('size-3', origin.tone)} />
            {origin.label}
          </Badge>
          {chosen && <Badge variant="secondary">Used here</Badge>}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{origin.meaning}</p>

      {/*
        The reason comes from the resolver, not from a rule restated here. That
        keeps this screen and the setup plan from ever disagreeing about why a
        source was or was not used.
      */}
      {considered && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {eligible ? 'Usable here — ' : 'Not used here — '}
            {considered.note}.
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
