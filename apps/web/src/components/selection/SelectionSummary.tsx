import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { APPLICATIONS } from '@configshell/catalog';
import { SelectionList } from './SelectionList';

interface SelectionSummaryProps {
  selectedIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/** Desktop sidebar summary — hidden on small screens in favor of the sticky bottom bar. */
export function SelectionSummary({ selectedIds, onRemove, onClear }: SelectionSummaryProps) {
  const selectedApps = APPLICATIONS.filter((app) => selectedIds.has(app.id));

  return (
    <Card className="hidden lg:block">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Selected applications</CardTitle>
        <span className="text-xs font-medium text-muted-foreground" aria-live="polite">
          {selectedApps.length} selected
        </span>
      </CardHeader>

      <CardContent>
        <SelectionList selectedApps={selectedApps} onRemove={onRemove} />

        {selectedApps.length > 0 && (
          <>
            <Separator className="my-3" />
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Clear all
            </Button>
          </>
        )}

        <p className="mt-5 border-t border-border pt-5 text-xs text-muted-foreground">
          Choose a distribution, then build the setup plan to see the exact commands.
          ConfigShell never installs anything itself.
        </p>
      </CardContent>
    </Card>
  );
}
