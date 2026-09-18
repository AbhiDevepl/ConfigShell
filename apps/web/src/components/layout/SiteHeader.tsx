import { Github } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { ThemeToggle } from './ThemeToggle';
import { gsap, useGSAP, shouldSkipEntrance, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (shouldSkipEntrance()) return;

      gsap.fromTo(
        '.header-brand',
        { opacity: 0, x: -8 },
        {
          opacity: 1,
          x: 0,
          duration: MOTION_DURATIONS.normal,
          ease: MOTION_EASINGS.subtle,
          clearProps: 'transform',
        },
      );

      gsap.fromTo(
        '.header-action-item',
        { opacity: 0, y: -4 },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_DURATIONS.normal,
          stagger: 0.04,
          delay: 0.05,
          ease: MOTION_EASINGS.subtle,
          clearProps: 'transform',
        },
      );
    },
    { scope: headerRef },
  );

  return (
    <header ref={headerRef} className="w-full border-b border-border bg-card/40 backdrop-blur-xs">
      {/*
        Three fixed roles: brand, context, actions. A grid rather than
        `justify-between` so the middle track is the one that absorbs the
        free space (and collapses first on a phone) — the brand and the
        actions keep their own intrinsic width at every size.
      */}
      <PageContainer className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5">
        <div className="header-brand flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            C
          </span>
          <span className="text-sm font-semibold tracking-tight">ConfigShell</span>
        </div>

        <p className="header-action-item hidden min-w-0 truncate text-xs text-muted-foreground sm:block">
          Discover Linux software. Nothing installs without your say.
        </p>

        <div className="col-start-3 flex items-center gap-1">
          <div className="header-action-item">
            <Button type="button" variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/AbhiDevepl/configshell"
                target="_blank"
                rel="noreferrer"
                aria-label="View source on GitHub"
              >
                <Github />
              </a>
            </Button>
          </div>
          <div className="header-action-item">
            <ThemeToggle />
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
