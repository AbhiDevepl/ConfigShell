import {
  Brain,
  Code,
  Gamepad2,
  Globe,
  GraduationCap,
  Laptop,
  LayoutGrid,
  Search,
  Server,
  Video,
  X,
} from 'lucide-react';
import { type ComponentType, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  APPLICATIONS,
  CATEGORIES,
  searchApplications,
  type Application,
  type Category,
} from '@configshell/catalog';
import { AppCard } from './AppCard';
import { gsap, useGSAP, prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface AppCatalogProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpenDetails: (app: Application) => void;
}

interface CategoryFilterItem {
  id: Category | 'All';
  label: string;
  icon: ComponentType<{ className?: string }>;
  description?: string;
}

/**
 * Role-oriented, actionable category navigation items for system setup recommendations:
 * - LayoutGrid for All
 * - Laptop for General (Everyday essentials)
 * - GraduationCap for Student (Coursework & research)
 * - Code for Developer (Software development essentials)
 * - Globe for Web Developer (Web stack & tooling)
 * - Server for DevOps (Containers & infrastructure)
 * - Brain for Data & AI (ML, notebooks & data)
 * - Video for Content Creator (Production, audio & media)
 * - Gamepad2 for Gaming (Gaming essentials & launchers)
 */
const CATEGORY_ITEMS: readonly CategoryFilterItem[] = [
  { id: 'All', label: 'All', icon: LayoutGrid, description: 'All verified software catalog applications' },
  {
    id: 'General',
    label: 'General',
    icon: Laptop,
    description: 'Everyday desktop essentials — browsing, email, media, communication, and utilities.',
  },
  {
    id: 'Student',
    label: 'Student',
    icon: GraduationCap,
    description: 'Study and coursework — note-taking, documents, research, PDFs, presentations, and collaboration.',
  },
  {
    id: 'Developer',
    label: 'Developer',
    icon: Code,
    description: 'Software development essentials — code editors, Git, terminals, runtimes, databases, and developer utilities.',
  },
  {
    id: 'Web Developer',
    label: 'Web Developer',
    icon: Globe,
    description: 'Web development stack — browsers, Node.js, frontend tooling, API clients, databases, and web utilities.',
  },
  {
    id: 'DevOps',
    label: 'DevOps',
    icon: Server,
    description: 'Infrastructure and deployment — containers, Kubernetes, SSH, cloud CLIs, monitoring, and server tools.',
  },
  {
    id: 'Data & AI',
    label: 'Data & AI',
    icon: Brain,
    description: 'Data science and AI development — Python, Jupyter, ML tools, notebooks, model tooling, and data utilities.',
  },
  {
    id: 'Content Creator',
    label: 'Content Creator',
    icon: Video,
    description: 'Video, audio, streaming, and content production — editors, recording tools, codecs, and media utilities.',
  },
  {
    id: 'Gaming',
    label: 'Gaming',
    icon: Gamepad2,
    description: 'Gaming essentials — game clients, compatibility layers, performance tools, and controllers.',
  },
] as const;

export function AppCatalog({ selectedIds, onToggle, onOpenDetails }: AppCatalogProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const tabsListId = useId();
  const catalogRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // Precompute catalog-wide counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: APPLICATIONS.length };
    for (const cat of CATEGORIES) {
      counts[cat] = 0;
    }
    for (const app of APPLICATIONS) {
      counts[app.category] = (counts[app.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  // Compute matching counts if an active search query is present
  const queryCounts = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const counts: Record<string, number> = {
      All: searchApplications({ query: trimmed }).length,
    };
    for (const cat of CATEGORIES) {
      counts[cat] = searchApplications({ query: trimmed, category: cat }).length;
    }
    return counts;
  }, [query]);

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

  useGSAP(
    () => {
      if (prefersReducedMotion() || !catalogRef.current) return;

      if (filtered.length === 0) {
        const emptyEl = catalogRef.current.querySelector('.catalog-empty-state');
        if (emptyEl) {
          gsap.fromTo(
            emptyEl,
            { opacity: 0, y: 6 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_DURATIONS.normal,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
        return;
      }

      // Limit stagger to the first batch of visible cards (up to 12 cards)
      // Remaining cards appear without delay, avoiding performance issues
      const cards = catalogRef.current.querySelectorAll('.catalog-cards-grid > label:nth-child(-n+12)');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: isFirstRender.current ? 0 : 0.4, y: 5 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_DURATIONS.normal,
            stagger: 0.025,
            ease: MOTION_EASINGS.subtle,
            clearProps: 'transform',
          },
        );
      }
      isFirstRender.current = false;
    },
    { dependencies: [query, activeCategory, filtered.length], scope: catalogRef },
  );

  const activeItem = useMemo(
    () => CATEGORY_ITEMS.find((item) => item.id === activeCategory) ?? CATEGORY_ITEMS[0],
    [activeCategory],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    e.preventDefault();
    const currentIndex = CATEGORY_ITEMS.findIndex((item) => item.id === activeCategory);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % CATEGORY_ITEMS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + CATEGORY_ITEMS.length) % CATEGORY_ITEMS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = CATEGORY_ITEMS.length - 1;
    }
    const nextItem = CATEGORY_ITEMS[nextIndex];
    if (nextItem) {
      setActiveCategory(nextItem.id);
      const tabElement = document.getElementById(`category-tab-${nextItem.id.toLowerCase().replace(/\s+/g, '-')}`);
      tabElement?.focus();
    }
  };

  return (
    <section ref={catalogRef} aria-labelledby="catalog-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="catalog-heading" className="text-xs font-semibold tracking-wide text-muted-foreground">
          Browse applications
        </h2>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {APPLICATIONS.length} available
        </span>
      </div>

      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        {APPLICATIONS.length} verified applications. Filter by category or search by name, id, and keyword.
      </p>

      {/* Search Input */}
      <div className="mt-4">
        <Label htmlFor="app-search" className="sr-only">
          Search applications
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="app-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications (e.g., vscode, vlc, git, docker, web)..."
            className="pl-8 pr-8"
          />
          {query && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => setQuery('')}
              aria-label="Clear search text"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabbed Navigation / Filter Chip Group */}
      <div className="mt-4">
        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
          <div
            id={tabsListId}
            role="tablist"
            aria-label="Filter applications by category"
            onKeyDown={handleKeyDown}
            className="flex w-max flex-nowrap items-center gap-1.5 pb-1 sm:w-full sm:flex-wrap"
          >
            {CATEGORY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeCategory === item.id;
              const count = queryCounts ? (queryCounts[item.id] ?? 0) : (categoryCounts[item.id] ?? 0);
              const tabId = `category-tab-${item.id.toLowerCase().replace(/\s+/g, '-')}`;

              return (
                <button
                  key={item.id}
                  id={tabId}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveCategory(item.id)}
                  className={cn(
                    'group inline-flex h-8.5 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 select-none cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'border-border bg-card text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded transition-colors',
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-foreground/80 group-hover:bg-foreground/10 group-hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'ml-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold transition-colors',
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-foreground/10 group-hover:text-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active category info & quick clear */}
        {(activeCategory !== 'All' || query.trim()) && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing {filtered.length} application{filtered.length === 1 ? '' : 's'}
                {activeCategory !== 'All' && (
                  <>
                    {' in '}
                    <strong className="font-semibold text-foreground">{activeItem.label}</strong>
                  </>
                )}
                {query.trim() && (
                  <>
                    {' matching '}
                    <strong className="font-semibold text-foreground">“{query.trim()}”</strong>
                  </>
                )}
              </span>
              {activeCategory !== 'All' && (
                <button
                  type="button"
                  id="clear-category-filter-btn"
                  onClick={() => setActiveCategory('All')}
                  className="inline-flex items-center gap-0.5 rounded px-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <X className="size-3" />
                  Show all categories
                </button>
              )}
            </div>

            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Active category role description */}
        {activeCategory !== 'All' && activeItem.description && (
          <p className="mt-2 text-xs text-muted-foreground/90">
            {activeItem.description}
          </p>
        )}
      </div>

      {/* Applications Grid / Empty State */}
      <div className="mt-3">
        {filtered.length === 0 ? (
          <Empty className="catalog-empty-state border border-dashed p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No applications found</EmptyTitle>
              <EmptyDescription>
                Nothing matches {query.trim() ? `“${query.trim()}”` : 'this category'}
                {activeCategory !== 'All' ? ` in ${activeItem.label}` : ''}.
              </EmptyDescription>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {activeCategory !== 'All' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCategory('All')}
                  >
                    Browse all categories
                  </Button>
                )}
                {query.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery('')}
                  >
                    Clear search query
                  </Button>
                )}
              </div>
            </EmptyHeader>
          </Empty>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Applications catalog list"
            className="lg:max-h-[calc(100vh-21.5rem)] lg:min-h-[360px] lg:overflow-y-auto lg:pr-1.5 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none rounded-lg"
          >
            <div className="catalog-cards-grid grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        )}
      </div>
    </section>
  );
}
