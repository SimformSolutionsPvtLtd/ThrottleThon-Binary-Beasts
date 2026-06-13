import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ForecastStateService } from '../../../../core/services/forecast-state.service';
import { ApiService } from '../../../../core/services/api.service';
import { Allocation, Developer } from '../../../../core/models/developer.model';
import { Scenario } from '../../../../core/models/scenario.model';
import { ResolvePseudonymPipe } from '../../../../shared/pipes/resolve-pseudonym.pipe';
import { DeveloperCardComponent } from './developer-card.component';
import {
  AllocationDialogComponent,
  AllocationDialogData,
  AllocationDialogResult,
} from './allocation-dialog.component';

const BENCH_LIST_ID = 'bench';

@Component({
  selector: 'ss-allocation-board',
  standalone: true,
  imports: [
    CommonModule,
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder,
    MatIconModule,
    ResolvePseudonymPipe,
    DeveloperCardComponent,
  ],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-content">Allocation Board</h2>
          <p class="text-sm text-content-muted mt-0.5">
            Drag developers onto a scenario, or focus a card and press Enter to allocate.
          </p>
        </div>
        @if (state.isForecastLoading()) {
          <div class="flex items-center gap-2 text-xs text-content-muted bg-surface-raised px-3 py-1.5 rounded-full border border-surface-overlay">
            <span class="h-2 w-2 rounded-full bg-brand-accent animate-pulse inline-block"></span>
            Recalculating…
          </div>
        }
      </div>

      @if (state.activeScenarios().length === 0) {
        <div class="bg-surface-raised rounded-xl p-8 text-center text-content-muted">
          No active scenarios selected. Choose scenarios on the dashboard to allocate developers.
        </div>
      } @else {
        <div class="grid gap-4 board-grid">

          <!-- Bench column -->
          <section class="bg-surface-raised rounded-xl p-4 flex flex-col" style="min-height:400px">
            <header class="sticky top-0 z-10 bg-surface-raised pb-3 mb-1">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-content uppercase tracking-wide">Bench</h3>
                <span class="text-xs text-content-muted">{{ state.benchDevelopers().length }} available</span>
              </div>
            </header>

            <div
              cdkDropList
              [id]="benchListId"
              [cdkDropListData]="benchListId"
              [cdkDropListConnectedTo]="scenarioListIds()"
              (cdkDropListDropped)="onDrop($event)"
              class="flex flex-col gap-2 flex-1 cdk-drop-zone"
            >
              @for (dev of state.benchDevelopers(); track dev.pseudonym) {
                <ss-developer-card
                  cdkDrag
                  [cdkDragData]="dev.pseudonym"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Developer ' + (dev.pseudonym | resolveName) + ', press Enter to allocate'"
                  (keydown.enter)="openKeyboardDialog(dev); $event.preventDefault()"
                  (keydown.space)="openKeyboardDialog(dev); $event.preventDefault()"
                  [dev]="dev"
                  [availablePercent]="dev.availablePercent"
                >
                  <div *cdkDragPlaceholder class="cdk-card-placeholder"></div>
                </ss-developer-card>
              }
              @if (state.benchDevelopers().length === 0) {
                <p class="text-xs text-content-muted text-center py-6">Everyone is fully allocated.</p>
              }
            </div>
          </section>

          <!-- Scenario columns -->
          @for (scenario of state.activeScenarios(); track scenario.externalId) {
            <section class="bg-surface-raised rounded-xl p-4 flex flex-col" style="min-height:400px">
              <header class="sticky top-0 z-10 bg-surface-raised pb-3 mb-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold text-content truncate">{{ scenario.name }}</h3>
                </div>
                <div class="text-xs text-content-muted mt-0.5">{{ columnSummary(scenario.externalId) }}</div>
              </header>

              <div
                cdkDropList
                [id]="scenario.externalId"
                [cdkDropListData]="scenario.externalId"
                [cdkDropListConnectedTo]="connectedTo(scenario.externalId)"
                (cdkDropListDropped)="onDrop($event)"
                class="flex flex-col gap-2 flex-1 cdk-drop-zone"
              >
                @for (alloc of allocationsFor(scenario.externalId); track alloc.devPseudonym) {
                  @if (devByPseudonym().get(alloc.devPseudonym); as dev) {
                    <ss-developer-card
                      cdkDrag
                      [cdkDragData]="alloc.devPseudonym"
                      tabindex="0"
                      [dev]="dev"
                      [allocated]="true"
                      [allocationPercent]="alloc.allocationPercent"
                      [sliderMax]="sliderMaxFor(alloc)"
                      (allocationChange)="onAllocationChange(scenario.externalId, alloc.devPseudonym, $event)"
                      (remove)="onRemove(scenario.externalId, alloc.devPseudonym)"
                    >
                      <div *cdkDragPlaceholder class="cdk-card-placeholder"></div>
                    </ss-developer-card>
                  }
                }
                @if (allocationsFor(scenario.externalId).length === 0) {
                  <p class="text-xs text-content-muted text-center py-6">Drop developers here.</p>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .board-grid {
      grid-template-columns: 1fr;
    }
    @media (min-width: 1280px) {
      .board-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .cdk-drop-zone.cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-card-placeholder {
      border: 2px dashed var(--brand-primary);
      border-radius: 0.5rem;
      min-height: 64px;
      background: rgba(37, 99, 235, 0.06);
    }
    .cdk-drag-preview {
      opacity: 0.85;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `],
})
export class AllocationBoardComponent implements OnInit {
  readonly state = inject(ForecastStateService);
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly benchListId = BENCH_LIST_ID;

  readonly devByPseudonym = computed(() => {
    const map = new Map<string, Developer>();
    for (const d of this.state.developers()) map.set(d.pseudonym, d);
    return map;
  });

  readonly scenarioListIds = computed(() =>
    this.state.activeScenarios().map(s => s.externalId)
  );

  ngOnInit(): void {
    // Ensure developers + allocations are available even when this is the full page.
    if (this.state.developers().length === 0) {
      this.api.getDevelopers().subscribe(devs => this.state.developers.set(devs));
    }
    if (this.state.allocations().length === 0) {
      this.api.getAllocations().subscribe(allocs => this.state.allocations.set(allocs));
    }
  }

  allocationsFor(scenarioExternalId: string): Allocation[] {
    return this.state.allocationsForScenario(scenarioExternalId);
  }

  connectedTo(scenarioExternalId: string): string[] {
    // Bench + every other scenario column.
    return [this.benchListId, ...this.scenarioListIds().filter(id => id !== scenarioExternalId)];
  }

  columnSummary(scenarioExternalId: string): string {
    const allocs = this.allocationsFor(scenarioExternalId);
    const total = allocs.reduce((sum, a) => sum + a.allocationPercent, 0);
    return `${allocs.length} dev${allocs.length === 1 ? '' : 's'} · ${total}%`;
  }

  /** Inline slider max = current allocation here + remaining free capacity elsewhere. */
  sliderMaxFor(alloc: Allocation): number {
    const used = this.state.allocatedPercentByDev().get(alloc.devPseudonym) ?? 0;
    const freeElsewhere = Math.max(0, 100 - used);
    return Math.min(100, alloc.allocationPercent + freeElsewhere);
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  onDrop(event: CdkDragDrop<string>): void {
    const sourceListId = event.previousContainer.data;
    const targetListId = event.container.data;
    const pseudonym = event.item.data as string;

    // 1. Same list → reorder only, no API call.
    if (sourceListId === targetListId) {
      return;
    }

    // Dropped back onto the bench → same as removing from the source scenario.
    if (targetListId === this.benchListId) {
      if (sourceListId !== this.benchListId) {
        this.onRemove(sourceListId, pseudonym);
      }
      return;
    }

    // Compute available capacity. When moving from a scenario, that scenario's
    // current allocation frees up and is available for the target.
    const used = this.state.allocatedPercentByDev().get(pseudonym) ?? 0;
    const freedFromSource = sourceListId === this.benchListId
      ? 0
      : (this.allocationsFor(sourceListId).find(a => a.devPseudonym === pseudonym)?.allocationPercent ?? 0);
    const available = Math.max(0, 100 - used + freedFromSource);

    if (available <= 0) {
      this.snackBar.open(
        `${pseudonym} is fully allocated. Remove from another scenario first.`,
        'Dismiss',
        { duration: 5000 },
      );
      return; // Item snaps back to source automatically (no list mutation done).
    }

    const targetScenario = this.state.activeScenarios().find(s => s.externalId === targetListId);
    if (!targetScenario) return;

    this.promptAllocation(pseudonym, available, targetScenario).subscribe(result => {
      if (!result) return; // cancelled → card stays in source
      const removeFromSource = sourceListId === this.benchListId ? null : sourceListId;
      this.commitAllocation(pseudonym, result.scenarioExternalId, result.allocationPercent, removeFromSource);
    });
  }

  // ── Keyboard path ────────────────────────────────────────────────────────────

  openKeyboardDialog(dev: Developer): void {
    const available = this.state.availableForDev(dev.pseudonym);
    if (available <= 0) {
      this.snackBar.open(
        `${dev.pseudonym} is fully allocated. Remove from another scenario first.`,
        'Dismiss',
        { duration: 5000 },
      );
      return;
    }
    const scenarios = this.state.activeScenarios().map(s => ({ externalId: s.externalId, name: s.name }));
    if (scenarios.length === 0) return;

    const dialogData: AllocationDialogData = {
      devLabel: this.state.resolvedName()(dev.pseudonym),
      available,
      scenarios,
    };
    this.dialog
      .open(AllocationDialogComponent, { data: dialogData, width: '360px', autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((result?: AllocationDialogResult) => {
        if (!result) return;
        this.commitAllocation(dev.pseudonym, result.scenarioExternalId, result.allocationPercent, null);
      });
  }

  private promptAllocation(pseudonym: string, available: number, scenario: Scenario) {
    const dialogData: AllocationDialogData = {
      devLabel: this.state.resolvedName()(pseudonym),
      available,
      scenarioName: scenario.name,
      scenarioExternalId: scenario.externalId,
    };
    return this.dialog
      .open(AllocationDialogComponent, { data: dialogData, width: '360px', autoFocus: 'first-tabbable' })
      .afterClosed();
  }

  // ── Inline slider on an allocated card ──────────────────────────────────────

  private allocationDebounce = new Map<string, ReturnType<typeof setTimeout>>();

  onAllocationChange(scenarioExternalId: string, pseudonym: string, percent: number): void {
    const key = `${scenarioExternalId}:${pseudonym}`;
    const existing = this.allocationDebounce.get(key);
    if (existing) clearTimeout(existing);
    this.allocationDebounce.set(
      key,
      setTimeout(() => {
        this.allocationDebounce.delete(key);
        this.commitAllocation(pseudonym, scenarioExternalId, percent, null);
      }, 300),
    );
  }

  onRemove(scenarioExternalId: string, pseudonym: string): void {
    this.api.deleteAllocation(scenarioExternalId, pseudonym).subscribe({
      next: () => {
        this.state.allocations.update(allocs =>
          allocs.filter(a => !(a.scenarioExternalId === scenarioExternalId && a.devPseudonym === pseudonym)),
        );
        this.recompute();
      },
      error: () => this.snackBar.open('Failed to remove allocation.', 'Dismiss', { duration: 4000 }),
    });
  }

  // ── Persistence + state update ──────────────────────────────────────────────

  /**
   * Persist an allocation, optionally removing the dev from a source scenario
   * first (move between columns), then update local state and recompute.
   */
  private commitAllocation(
    pseudonym: string,
    scenarioExternalId: string,
    allocationPercent: number,
    removeFromScenario: string | null,
  ): void {
    const allocation: Allocation = { devPseudonym: pseudonym, scenarioExternalId, allocationPercent };

    const deleteOp: Observable<unknown> = removeFromScenario
      ? this.api.deleteAllocation(removeFromScenario, pseudonym).pipe(map(() => null))
      : of(null);

    deleteOp.subscribe({
      next: () => {
        this.api.updateAllocation(allocation).subscribe({
          next: () => {
            this.state.allocations.update(allocs => {
              let next = allocs;
              if (removeFromScenario) {
                next = next.filter(a => !(a.scenarioExternalId === removeFromScenario && a.devPseudonym === pseudonym));
              }
              const idx = next.findIndex(
                a => a.scenarioExternalId === scenarioExternalId && a.devPseudonym === pseudonym,
              );
              if (idx >= 0) {
                next = next.map((a, i) => (i === idx ? allocation : a));
              } else {
                next = [...next, allocation];
              }
              return next;
            });
            this.recompute();
          },
          error: () => this.snackBar.open('Failed to save allocation.', 'Dismiss', { duration: 4000 }),
        });
      },
      error: () => this.snackBar.open('Failed to move allocation.', 'Dismiss', { duration: 4000 }),
    });
  }

  /** Recompute the forecast with the current allocations + parameters. */
  private recompute(): void {
    const ids = this.state.activeScenarioIds();
    if (!ids.length) return;
    this.state.isForecastLoading.set(true);
    this.api
      .computeForecast({
        scenarioIds: ids,
        priorityPressure: this.state.priorityPressure(),
        scopePercent: this.state.scopePercent(),
        contingencyBuffer: this.state.contingencyBuffer() / 100,
        allocations: this.state.allocations(),
      })
      .subscribe({
        next: res => {
          this.state.forecastResults.set(res.results);
          this.state.winner.set(res.winner);
          this.state.isForecastLoading.set(false);
        },
        error: () => this.state.isForecastLoading.set(false),
      });
  }
}
