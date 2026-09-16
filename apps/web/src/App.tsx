/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppCatalog } from '@/components/applications/AppCatalog';
import { AppDetailSheet } from '@/components/applications/AppDetailSheet';
import { EnvironmentStep } from '@/components/environment/EnvironmentStep';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PlanView } from '@/components/plan/PlanView';
import { RoleSelector } from '@/components/roles/RoleSelector';
import { SelectionBar } from '@/components/selection/SelectionBar';
import { SelectionSummary } from '@/components/selection/SelectionSummary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSetupPlan } from '@/hooks/useSetupPlan';
import type { Application, Distro, Role } from '@configshell/catalog';

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

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <SiteHeader />

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10 sm:px-8">
          {view === 'build' ? (
            <>
              <section className="py-6">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Install the Linux apps you actually need.
                </h1>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Pick your distribution, choose applications, and get the exact commands to
                  run. ConfigShell generates them — you run them. Nothing installs
                  automatically.
                </p>
              </section>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
                <div className="flex min-w-0 flex-col gap-10">
                  <EnvironmentStep distro={distro} onSelect={setDistro} />
                  <RoleSelector
                    appliedRoleId={appliedRoleId}
                    onApply={applyRole}
                    onClear={clearAll}
                  />
                  <AppCatalog
                    selectedIds={selectedIds}
                    onToggle={toggleApp}
                    onOpenDetails={setDetailApp}
                  />
                </div>

                <div className="lg:sticky lg:top-6">
                  <SelectionSummary
                    selectedIds={selectedIds}
                    onRemove={removeApp}
                    onClear={clearAll}
                  />
                </div>
              </div>
            </>
          ) : (
            <div ref={planHeadingRef} tabIndex={-1} className="py-6 outline-none">
              <PlanView
                status={status}
                plan={plan}
                error={error}
                onBack={() => setView('build')}
                onRetry={buildPlan}
              />
            </div>
          )}
        </main>

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
