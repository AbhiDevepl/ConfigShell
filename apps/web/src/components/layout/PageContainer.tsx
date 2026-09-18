import type { ElementType, ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Defaults to a plain div; pass `main`/`header` where the element matters. */
  as?: ElementType;
  ref?: Ref<HTMLElement>;
}

/**
 * The one content container.
 *
 * Every band that spans the full page — the header, the main grid, the sticky
 * selection bar — puts its contents in this, so they line up with each other
 * instead of each picking its own max-width and gutter. Before this, the same
 * `max-w-7xl px-4 sm:px-6` was written out in three places, and the category
 * strip's full-bleed negative margin was tuned against the *wrong* one of them
 * (`-mx-6` against a 1rem gutter), which pushed the page 8px wider than the
 * viewport on a phone.
 *
 * The width and gutter come from `--layout-max-width` / `--layout-gutter` in
 * `index.css`, applied as a style rather than a utility class so there is a
 * single definition and the responsive gutter is a media query on the token.
 */
export function PageContainer({ children, className, as: Component = 'div', ref }: PageContainerProps) {
  return (
    <Component
      ref={ref}
      className={cn('mx-auto w-full', className)}
      style={{ maxWidth: 'var(--layout-max-width)', paddingInline: 'var(--layout-gutter)' }}
    >
      {children}
    </Component>
  );
}
