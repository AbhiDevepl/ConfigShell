import { X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Application } from '@configshell/catalog';
import { gsap, useGSAP, shouldSkipEntrance, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface SelectionListProps {
  selectedApps: Application[];
  onRemove: (id: string) => void;
}

/** Shared list markup used by both the desktop sidebar and the mobile sheet. */
export function SelectionList({ selectedApps, onRemove }: SelectionListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(selectedApps.length);

  useGSAP(
    () => {
      if (shouldSkipEntrance() || !containerRef.current) return;

      if (selectedApps.length === 0) {
        const emptyEl = containerRef.current.querySelector('.selection-empty-state');
        if (emptyEl) {
          gsap.fromTo(
            emptyEl,
            { opacity: 0, y: 3 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_DURATIONS.micro,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
        prevCountRef.current = 0;
        return;
      }

      // If an item was just added, animate newly mounted item
      if (selectedApps.length > prevCountRef.current) {
        const lastItem = containerRef.current.querySelector('ul > li:last-child');
        if (lastItem) {
          gsap.fromTo(
            lastItem,
            { opacity: 0, y: 4 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_DURATIONS.micro,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
      }
      prevCountRef.current = selectedApps.length;
    },
    { dependencies: [selectedApps.length], scope: containerRef },
  );

  return (
    <div ref={containerRef}>
      {selectedApps.length === 0 ? (
        <Empty className="selection-empty-state p-3">
          <EmptyTitle className="text-xs font-medium">No applications selected</EmptyTitle>
          <EmptyDescription className="text-[11px]">Choose applications to build your Linux setup.</EmptyDescription>
        </Empty>
      ) : (
        <ScrollArea className="max-h-48">
          <ul className="flex flex-col gap-1.5 pr-2">
            {selectedApps.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-2.5 py-1 text-xs">
                <span className="truncate font-medium">{app.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemove(app.id)}
                  aria-label={`Remove ${app.name} from selection`}
                  className="size-5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
