import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            L
          </span>
          <span className="text-sm font-semibold tracking-tight">Linux App Platform</span>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Discover Linux software. Nothing installs without your say.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
