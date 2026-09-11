import { Code2, Globe, MessageCircle, PlayCircle, SlidersHorizontal, Terminal, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Category, MockApp } from '@/data/mockCatalog';

// Safe, generic per-category placeholders — not brand logos. We don't have
// verified rights or assets for real application icons yet (that's a later
// phase, once real catalog entries exist).
const CATEGORY_ICON: Record<Category, ComponentType<{ className?: string }>> = {
  Browsers: Globe,
  'Code Editors': Code2,
  'CLI Tools': Terminal,
  Development: Wrench,
  Utilities: SlidersHorizontal,
  Media: PlayCircle,
  Communication: MessageCircle,
};

interface AppCardProps {
  app: MockApp;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function AppCard({ app, selected, onToggle }: AppCardProps) {
  const Icon = CATEGORY_ICON[app.category];
  const inputId = `app-${app.id}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-foreground/25',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <Checkbox
          id={inputId}
          checked={selected}
          onCheckedChange={() => onToggle(app.id)}
          aria-label={`Select ${app.name}`}
        />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">{app.name}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{app.description}</p>
      </div>

      <Badge variant="outline" className="w-fit">
        {app.category}
      </Badge>
    </label>
  );
}
