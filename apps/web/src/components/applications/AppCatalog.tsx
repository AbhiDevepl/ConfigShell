import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  APPLICATIONS,
  CATEGORIES,
  searchApplications,
  type Application,
  type Category,
} from '@configshell/catalog';
import { AppCard } from './AppCard';

interface AppCatalogProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpenDetails: (app: Application) => void;
}

export function AppCatalog({ selectedIds, onToggle, onOpenDetails }: AppCatalogProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

  // Search lives in the catalog package so the web app, the API and any future
  // client answer the same question the same way. It also matches on `id`,
  // which the old local filter did not — "vscode" now finds Visual Studio Code.
  const filtered = useMemo(
    () =>
      searchApplications({
        query,
        category: activeCategory === 'All' ? undefined : activeCategory,
      }),
    [query, activeCategory],
  );

  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" className="text-xs font-semibold tracking-wide text-muted-foreground">
        3. Browse applications
      </h2>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        {APPLICATIONS.length} verified applications. Open an application for its installation
        sources and who packages them.
      </p>

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

      <div className="mt-4 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
        <ToggleGroup
          type="single"
          variant="outline"
          value={activeCategory}
          onValueChange={(value) => setActiveCategory((value || 'All') as Category | 'All')}
          className="w-max flex-nowrap justify-start sm:w-full sm:flex-wrap"
          aria-label="Filter by category"
        >
          <ToggleGroupItem value="All">All</ToggleGroupItem>
          {CATEGORIES.map((category) => (
            <ToggleGroupItem key={category} value={category}>
              {category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

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
              <EmptyDescription>
                Nothing matches {query.trim() ? `“${query.trim()}”` : 'this filter'}
                {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}. Try another search
                or category.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                selected={selectedIds.has(app.id)}
                onToggle={onToggle}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
