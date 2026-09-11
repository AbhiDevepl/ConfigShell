import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APPLICATIONS } from '@linux-app-platform/catalog';
import { SelectionList } from './SelectionList';

interface SelectionBarProps {
  selectedIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/**
 * Sticky bottom bar, visible at every breakpoint. On small screens (where
 * the sidebar SelectionSummary is hidden) "View" opens the full list in a
 * sheet. "Continue" is intentionally non-functional in Phase 1 — no command
 * generation exists yet — so it's kept inert with an explanatory tooltip
 * rather than faking a next step.
 */
export function SelectionBar({ selectedIds, onRemove, onClear }: SelectionBarProps) {
  const selectedApps = APPLICATIONS.filter((app) => selectedIds.has(app.id));
  const count = selectedApps.length;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3 sm:px-8">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {count} application{count === 1 ? '' : 's'} selected
          </p>
          {count > 0 && (
            <p className="truncate text-xs text-muted-foreground lg:hidden">
              {selectedApps.map((app) => app.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="lg:hidden" disabled={count === 0}>
                View
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Selected applications</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <SelectionList selectedApps={selectedApps} onRemove={onRemove} />
                {count > 0 && (
                  <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={onClear}>
                    Clear all
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                aria-disabled="true"
                className="cursor-not-allowed opacity-60"
                onClick={(e) => e.preventDefault()}
              >
                Continue
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command generation isn't part of Phase 1 yet.</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
