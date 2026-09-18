import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';

interface AppShellProps {
  children: ReactNode;
}

/**
 * The one page frame every view shares.
 *
 * Owns the full-height flex column and the site header. Views render their own
 * `<main>` content inside, so the shell is a place, not a template: the header
 * stays put across the build and plan views, and the sticky selection bar on
 * the build view sits above the bottom edge of this column.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <SiteHeader />
      {children}
    </div>
  );
}