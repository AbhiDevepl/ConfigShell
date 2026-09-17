import { Check, Copy, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/useClipboard';
import { OUTCOMES } from '@/components/plan/outcomes';
import { cn } from '@/lib/utils';

interface CommandBlockProps {
  command: string;
  privileged: boolean;
  summary?: string;
  /** A precondition the user must satisfy themselves, e.g. the Flathub remote. */
  note?: string;
}

/**
 * One command, shown in full before it can be copied.
 *
 * The command text is always visible — never truncated behind a copy button,
 * never hidden behind "copy all". A user is being asked to run this on their
 * own machine, sometimes as root, and cannot consent to something they have not
 * read.
 *
 * Rendered as plain text in a `<code>` element. Nothing here executes anything:
 * the browser has no mechanism to, and the page never tries.
 */
export function CommandBlock({ command, privileged, summary, note }: CommandBlockProps) {
  const { state, copy } = useClipboard();
  const PrivilegedIcon = OUTCOMES.privileged.Icon;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card',
        // Privileged is not an error, so it does not borrow the destructive
        // colour — a failed request and a root command must not look alike.
        privileged ? OUTCOMES.privileged.border : 'border-border',
      )}
    >
      {(summary || privileged) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
          {privileged && (
            <Badge
              variant="outline"
              className={cn('shrink-0', OUTCOMES.privileged.text, OUTCOMES.privileged.border)}
            >
              <PrivilegedIcon aria-hidden="true" className="size-3" />
              {OUTCOMES.privileged.label}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 p-3">
        {/*
          `overflow-wrap: anywhere`, not `break-all`: a package identifier must
          wrap as a unit. `break-all` split `org.mozilla.firefox` after its
          first character on a narrow screen, which misrepresents the thing the
          user is about to run.
        */}
        <code className="min-w-0 flex-1 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] select-all">
          {command}
        </code>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          // Comfortable thumb target on a phone, where this is the primary
          // action; back to the compact icon size once there is a pointer.
          className="size-11 shrink-0 sm:size-8"
          onClick={() => copy(command)}
          aria-label={`Copy command: ${command}`}
        >
          {state === 'copied' ? (
            <Check aria-hidden="true" className={OUTCOMES.installable.text} />
          ) : state === 'failed' ? (
            <X aria-hidden="true" className="text-destructive" />
          ) : (
            <Copy aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Announced to screen readers; the icon alone is not enough. */}
      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Command copied to clipboard' : ''}
        {state === 'failed' ? 'Could not copy. Select the command text to copy it manually.' : ''}
      </span>

      {state === 'failed' && (
        <p className="px-3 pb-2 text-xs text-destructive">
          Couldn't copy automatically — select the text above instead.
        </p>
      )}

      {note && (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
