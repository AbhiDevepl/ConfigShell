/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppCatalog } from '@/components/applications/AppCatalog';
import { LinuxDetectionCard } from '@/components/detection/LinuxDetectionCard';
import { DistroSelector } from '@/components/distro/DistroSelector';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SelectionBar } from '@/components/selection/SelectionBar';
import { SelectionSummary } from '@/components/selection/SelectionSummary';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Distro } from '@/data/distros';

export default function App() {
  const [distro, setDistro] = useState<Distro | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleApp = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const removeApp = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const clearAll = () => setSelectedIds(new Set());

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <SiteHeader />

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-10 sm:px-8">
          <section className="py-8">
            <LinuxDetectionCard />
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Find and select Linux software, your way.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Pick your distribution, browse applications, and build a selection. Nothing
              installs automatically — you stay in control the whole way.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-10">
              <DistroSelector selected={distro} onSelect={setDistro} />
              <AppCatalog selectedIds={selectedIds} onToggle={toggleApp} />
            </div>

            <div className="lg:sticky lg:top-6">
              <SelectionSummary selectedIds={selectedIds} onRemove={removeApp} onClear={clearAll} />
            </div>
          </div>
        </main>

        <SelectionBar selectedIds={selectedIds} onRemove={removeApp} onClear={clearAll} />
      </div>
    </TooltipProvider>
  );
}
