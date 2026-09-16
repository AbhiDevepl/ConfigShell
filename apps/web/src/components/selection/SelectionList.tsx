import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Application } from '@configshell/catalog';

interface SelectionListProps {
  selectedApps: Application[];
  onRemove: (id: string) => void;
}

/** Shared list markup used by both the desktop sidebar and the mobile sheet. */
export function SelectionList({ selectedApps, onRemove }: SelectionListProps) {
  if (selectedApps.length === 0) {
    return (
      <Empty className="p-4">
        <EmptyTitle>No applications selected</EmptyTitle>
        <EmptyDescription>Choose applications to build your Linux setup.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <ScrollArea className="max-h-72">
      <ul className="flex flex-col gap-2 pr-3">
        {selectedApps.map((app) => (
          <li key={app.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
            <span className="truncate text-sm">{app.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(app.id)}
              aria-label={`Remove ${app.name} from selection`}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
