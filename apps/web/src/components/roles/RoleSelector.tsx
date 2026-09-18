import { Check, ChevronDown, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROLES, applicationsForRole, type Role } from '@configshell/catalog';

interface RoleSelectorProps {
  /** The preset most recently applied, if any. Applying is not a lasting mode. */
  appliedRoleId: string | null;
  onApply: (role: Role) => void;
  onClear: () => void;
}

/**
 * Step 2 — what are you using this computer for (PRD §15).
 *
 * A preset is a **curated list of catalog ids**, nothing more. There is no
 * model here, no scoring and no personalisation: choosing "Web developer"
 * selects a fixed set that a contributor can argue with in a pull request.
 *
 * Two deliberate choices:
 *
 * - **It adds to the selection; it never replaces it.** Applying a second
 *   preset, or applying one after hand-picking, is additive — the user's own
 *   choices are never silently discarded (PRD §19).
 * - **It shows what it will select before you commit.** The count and the
 *   application names are visible up front, so a preset is a shortcut rather
 *   than a black box.
 *
 * Skipping this step entirely is a first-class path, not a fallback.
 */
export function RoleSelector({ appliedRoleId, onApply, onClear }: RoleSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section aria-labelledby="role-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="role-heading"
          className="text-xs font-semibold tracking-wide text-muted-foreground"
        >
          What is this machine for?
        </h2>
        {appliedRoleId && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <X aria-hidden="true" />
            Clear selection
          </Button>
        )}
      </div>

      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        Optional. A preset adds a curated set of applications to your selection — you can
        change anything afterwards, and you can skip this and browse instead.
      </p>

      <ul className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const applied = appliedRoleId === role.id;
          const expanded = expandedId === role.id;
          const recommended = applicationsForRole(role, 'recommended');
          const optional = applicationsForRole(role, 'optional');
          const detailsId = `role-${role.id}-apps`;

          return (
            <li
              key={role.id}
              className={cn(
                'flex flex-col justify-between gap-1.5 rounded-lg border p-2.5 transition-colors',
                applied
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-foreground/20',
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-medium truncate">{role.name}</p>
                  {applied && (
                    <Badge variant="secondary" className="h-4 px-1 text-[9px] font-normal shrink-0">
                      <Check aria-hidden="true" className="size-2.5 mr-0.5" />
                      Applied
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground line-clamp-1">
                  {role.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant={applied ? 'outline' : 'default'}
                  aria-label={
                    applied
                      ? `Apply the ${role.name} preset again`
                      : `Add ${recommended.length} ${role.name} applications to your selection`
                  }
                  onClick={() => onApply(role)}
                  className="h-6 px-2 text-[11px]"
                >
                  <Sparkles aria-hidden="true" className="size-2.5" />
                  {applied ? 'Re-apply' : `+${recommended.length} apps`}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  aria-expanded={expanded}
                  aria-controls={detailsId}
                  aria-label={
                    expanded
                      ? `Hide what the ${role.name} preset adds`
                      : `Show what the ${role.name} preset adds`
                  }
                  onClick={() => setExpandedId(expanded ? null : role.id)}
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {expanded ? 'Hide' : 'Details'}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn('size-3 transition-transform', expanded && 'rotate-180')}
                  />
                </Button>
              </div>

              {expanded && (
                <div id={detailsId} className="border-t border-border pt-1.5 text-[10px]">
                  <p className="font-medium text-foreground">Adds:</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {recommended.map((app) => app.name).join(', ')}
                  </p>
                  {optional.length > 0 && (
                    <>
                      <p className="mt-1 font-medium text-foreground">Also recommended:</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {optional.map((app) => app.name).join(', ')}
                      </p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
