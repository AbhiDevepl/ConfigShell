import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CATEGORIES, MOCK_CATALOG, type Category } from '@/data/mockCatalog';
import { AppCard } from './AppCard';

interface AppCatalogProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function AppCatalog({ selectedIds, onToggle }: AppCatalogProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_CATALOG.filter((app) => {
      const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        2. Browse applications
      </h2>

      <div className="mt-4">
        <Label htmlFor="app-search" className="sr-only">
          Search applications
        </Label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="app-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications"
            className="pl-8"
          />
        </div>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={activeCategory}
        onValueChange={(value) => setActiveCategory((value || 'All') as Category | 'All')}
        className="mt-4 flex-wrap justify-start"
        aria-label="Filter by category"
      >
        <ToggleGroupItem value="All">All</ToggleGroupItem>
        {CATEGORIES.map((category) => (
          <ToggleGroupItem key={category} value={category}>
            {category}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} application{filtered.length === 1 ? '' : 's'}
      </p>

      <div className="mt-3">
        {filtered.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No applications found</EmptyTitle>
              <EmptyDescription>Try another search or category.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((app) => (
              <AppCard key={app.id} app={app} selected={selectedIds.has(app.id)} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
