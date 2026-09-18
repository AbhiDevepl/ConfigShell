/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppCatalog } from '@/components/applications/AppCatalog';
import { AppDetailSheet } from '@/components/applications/AppDetailSheet';
import { EnvironmentStep } from '@/components/environment/EnvironmentStep';
import { PageContainer } from '@/components/layout/PageContainer';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PlanView } from '@/components/plan/PlanView';
import { RoleSelector } from '@/components/roles/RoleSelector';
import { SelectionBar } from '@/components/selection/SelectionBar';
import { SelectionSummary } from '@/components/selection/SelectionSummary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSetupPlan } from '@/hooks/useSetupPlan';
import type { Application, Distro, Role } from '@configshell/catalog';
import { gsap, useGSAP, shouldSkipEntrance, MOTION_EASINGS } from '@/lib/motion';

/**
 * The deterministic ConfigShell flow.
 *
 * Two views rather than a wizard: **build** (environment → role → browse →
 * select) stays one scrollable page, because every part of it is something a
 * user revises while looking at the rest. **plan** is separate, because it is a
 * different question — "here is what to run" — and mixing it into the browse
 * page would bury it.
 *
 * Selection state lives here and is the single source of truth for both views.
 */
type View = 'build' | 'plan';

export default function App() {
  const [view, setView] = useState<View>('build');
  const [distro, setDistro] = useState<Distro | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [appliedRoleId, setAppliedRoleId] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<Application | null>(null);

  const { status, plan, error, generate, reset } = useSetupPlan();
  const planHeadingRef = useRef<HTMLDivElement>(null);

  const toggleApp = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeApp = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setAppliedRoleId(null);
  }, []);

  /**
   * Applying a preset **adds** to the selection rather than replacing it, so a
   * user who has already hand-picked things does not lose them (PRD §19).
   */
  const applyRole = useCallback((role: Role) => {
    setSelectedIds((prev) => new Set([...prev, ...role.recommended]));
    setAppliedRoleId(role.id);
  }, []);

  /**
   * A plan is only true for the selection and distribution it was built from.
   * Changing either invalidates it, so it is dropped rather than left on screen
   * describing something the user has moved on from.
   */
  useEffect(() => {
    reset();
  }, [selectedIds, distro, reset]);

  const canContinue = distro !== null && selectedIds.size > 0;
  const blockedReason =
    distro === null
      ? 'Choose your distribution first — commands depend on it.'
      : 'Select at least one application.';

  const buildPlan = useCallback(() => {
    if (!distro || selectedIds.size === 0) return;
    setView('plan');
    void generate([...selectedIds], distro);
  }, [distro, selectedIds, generate]);

  // Moving between views is a navigation, so move focus with it rather than
  // leaving a keyboard or screen-reader user at the bottom of the old page.
  useEffect(() => {
    if (view === 'plan') planHeadingRef.current?.focus();
  }, [view]);

  const mainRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (shouldSkipEntrance() || !mainRef.current) return;

      if (view === 'build') {
        const tl = gsap.timeline();
        tl.fromTo(
          '.motion-entrance-header',
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.25, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
          0.0,
        )
          .fromTo(
            '.motion-entrance-env',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.28, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
            0.05,
          )
          .fromTo(
            '.motion-entrance-roles',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.28, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
            0.1,
          )
          .fromTo(
            '.motion-entrance-catalog',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
            0.15,
          )
          .fromTo(
            '.motion-entrance-summary',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
            0.2,
          );
      } else if (view === 'plan') {
        gsap.fromTo(
          planHeadingRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.25, ease: MOTION_EASINGS.subtle, clearProps: 'transform' },
        );
      }
    },
    { dependencies: [view], scope: mainRef },
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <SiteHeader />

        <PageContainer as="main" ref={mainRef} className="flex-1 pb-6">
          {view === 'build' ? (
            <>
              <section className="motion-entrance-header pt-2.5 pb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                    Install the Linux apps you actually need.
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Pick your distribution, choose applications, and get the exact commands. Nothing installs automatically.
                  </p>
                </div>
              </section>

              {/*
                The page grid. One column until there is room for two; then
                primary content takes the free space and the selection panel
                gets a bounded, readable column. `minmax(0, 1fr)` rather than
                `1fr` on the first track: a bare `1fr` has a min-content floor,
                so a long command or identifier inside the catalog would widen
                the whole page instead of wrapping.
              */}
              <div className="grid grid-cols-1 gap-(--layout-gap) lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
                {/*
                  `minmax(0, 1fr)` on the single column is load-bearing, not
                  decoration: a grid item's default `min-width: auto` lets a
                  nowrap label inside the environment cards size this track to
                  max-content, which pushed the whole page past 1200px on a
                  phone. An `auto` track would do it again.
                */}
                <div className="grid auto-rows-min grid-cols-[minmax(0,1fr)] gap-(--layout-gap)">
                  <div className="motion-entrance-env">
                    <EnvironmentStep distro={distro} onSelect={setDistro} />
                  </div>
                  <div className="motion-entrance-roles">
                    <RoleSelector
                      appliedRoleId={appliedRoleId}
                      onApply={applyRole}
                      onClear={clearAll}
                    />
                  </div>
                  <div className="motion-entrance-catalog">
                    <AppCatalog
                      selectedIds={selectedIds}
                      onToggle={toggleApp}
                      onOpenDetails={setDetailApp}
                    />
                  </div>
                </div>

                <div className="motion-entrance-summary lg:sticky lg:top-3 lg:max-h-[calc(100svh-1.5rem)] lg:overflow-y-auto">
                  <SelectionSummary
                    selectedIds={selectedIds}
                    onRemove={removeApp}
                    onClear={clearAll}
                    canContinue={canContinue}
                    blockedReason={blockedReason}
                    onContinue={buildPlan}
                  />
                </div>
              </div>
            </>
          ) : (
            <div ref={planHeadingRef} tabIndex={-1} className="py-4 outline-none">
              <PlanView
                status={status}
                plan={plan}
                error={error}
                onBack={() => setView('build')}
                onRetry={buildPlan}
              />
            </div>
          )}
        </PageContainer>

        {view === 'build' && (
          <SelectionBar
            selectedIds={selectedIds}
            onRemove={removeApp}
            onClear={clearAll}
            canContinue={canContinue}
            blockedReason={blockedReason}
            onContinue={buildPlan}
          />
        )}

        <AppDetailSheet
          app={detailApp}
          distro={distro}
          selected={detailApp ? selectedIds.has(detailApp.id) : false}
          onToggle={toggleApp}
          onOpenChange={(open) => !open && setDetailApp(null)}
        />
      </div>
    </TooltipProvider>
  );
}
