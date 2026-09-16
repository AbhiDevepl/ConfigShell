import { Check, Sparkles, X } from 'lucide-react';
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
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          2. What is this machine for?
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

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                'flex flex-col gap-3 rounded-xl border p-4 transition-colors',
                applied
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{role.name}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {role.description}
                  </p>
                </div>
                {applied && (
                  <Badge variant="secondary" className="shrink-0">
                    <Check aria-hidden="true" className="size-3" />
                    Applied
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/*
                  Both buttons carry the role name in their accessible name.
                  Visually the heading above supplies the context; to someone
                  tabbing through, five buttons all reading "Add 5 apps" or
                  "Show what it adds" are indistinguishable.
                */}
                <Button
                  type="button"
                  size="sm"
                  variant={applied ? 'outline' : 'default'}
                  aria-label={
                    applied
                      ? `Apply the ${role.name} preset again`
                      : `Add ${recommended.length} ${role.name} applications to your selection`
                  }
                  onClick={() => onApply(role)}
                >
                  <Sparkles aria-hidden="true" />
                  {applied ? 'Apply again' : `Add ${recommended.length} apps`}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-expanded={expanded}
                  aria-controls={detailsId}
                  aria-label={
                    expanded
                      ? `Hide what the ${role.name} preset adds`
                      : `Show what the ${role.name} preset adds`
                  }
                  onClick={() => setExpandedId(expanded ? null : role.id)}
                >
                  {expanded ? 'Hide' : 'Show what it adds'}
                </Button>
              </div>

              {expanded && (
                <div id={detailsId} className="border-t border-border pt-3 text-xs">
                  <p className="font-medium">Added to your selection</p>
                  <p className="mt-1 text-muted-foreground">
                    {recommended.map((app) => app.name).join(', ')}
                  </p>
                  {optional.length > 0 && (
                    <>
                      <p className="mt-3 font-medium">Often useful too — browse and add these yourself</p>
                      <p className="mt-1 text-muted-foreground">
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
