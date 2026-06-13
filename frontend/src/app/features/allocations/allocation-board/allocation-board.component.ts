import {
  Component, inject, computed, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, Subject } from 'rxjs';
import { ForecastStateService } from '../../../core/services/forecast-state.service';
import { ApiService } from '../../../core/services/api.service';
import { Developer, Allocation } from '../../../core/models/developer.model';
import { Scenario } from '../../../core/models/scenario.model';
import { DeveloperCardComponent } from '../developer-card/developer-card.component';
import { AllocationDialogComponent, AllocationDialogData, AllocationDialogResult } from '../allocation-dialog/allocation-dialog.component';

/** Mutable local snapshot of a developer with a working allocation% for a specific scenario */
interface AllocatedDev {
  dev: Developer;
  allocationPercent: number;
  scenarioExternalId: string;
}

@Component({
  selector: 'ss-allocation-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    DeveloperCardComponent,
  ],
  template: `
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-content-muted uppercase tracking-wide">Allocation Board</h3>
        <span class="text-xs text-content-muted">Drag developers into scenarios to allocate them</span>
      </div>

      <!-- Kanban grid -->
      <div class="grid gap-4" [style.grid-template-columns]="columnTemplate()">

        <!-- BENCH COLUMN -->
        <div class="bg-surface-raised rounded-xl flex flex-col" style="min-height:400px">
          <div class="px-4 pt-4 pb-3 border-b border-surface-overlay sticky top-0 bg-surface-raised rounded-t-xl z-10">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-content">Bench</span>
              <span class="text-xs text-content-muted bg-surface px-2 py-0.5 rounded-full">{{ bench().length }} devs</span>
            </div>
            <p class="text-[10px] text-content-muted mt-0.5">Available for allocation</p>
          </div>

          <div
            cdkDropList
            id="bench"
            [cdkDropListData]="bench()"
            [cdkDropListConnectedTo]="allDropListIds()"
            (cdkDropListDropped)="onDrop($event, null)"
            class="flex-1 p-3 space-y-2 overflow-y-auto"
            cdkDropListOrientation="vertical"
          >
            @for (dev of bench(); track dev.pseudonym) {
              <div cdkDrag [cdkDragData]="dev" class="cdk-drag-item">
                <ss-developer-card
                  [dev]="dev"
                  [showRemove]="false"
                  (keyboardActivate)="openKeyboardDialog($event)"
                />
                <!-- CDK drag placeholder -->
                <div class="cdk-drag-placeholder" *cdkDragPlaceholder>
                  <div class="h-16 rounded-lg border-2 border-dashed border-brand-primary/40 bg-brand-primary/5"></div>
                </div>
              </div>
            }

            @if (!bench().length) {
              <div class="flex items-center justify-center h-20 text-xs text-content-muted">
                All developers allocated
              </div>
            }
          </div>
        </div>

        <!-- SCENARIO COLUMNS -->
        @for (scenario of forecastState.activeScenarios(); track scenario.externalId) {
          <div class="bg-surface-raised rounded-xl flex flex-col" style="min-height:400px">
            <!-- Column header -->
            <div class="px-4 pt-4 pb-3 border-b border-surface-overlay sticky top-0 bg-surface-raised rounded-t-xl z-10">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-content truncate">{{ scenario.name }}</span>
                <span class="text-xs text-content-muted bg-surface px-2 py-0.5 rounded-full flex-shrink-0">
                  {{ scenarioSummary(scenario.externalId) }}
                </span>
              </div>
              <p class="text-[10px] text-content-muted mt-0.5 capitalize">{{ scenario.category }}</p>
            </div>

            <!-- Drop list -->
            <div
              cdkDropList
              [id]="'scenario-' + scenario.externalId"
              [cdkDropListData]="allocatedForScenario(scenario.externalId)"
              [cdkDropListConnectedTo]="allDropListIds()"
              (cdkDropListDropped)="onDrop($event, scenario)"
              class="flex-1 p-3 space-y-2 overflow-y-auto"
              cdkDropListOrientation="vertical"
            >
              @for (item of allocatedForScenario(scenario.externalId); track item.dev.pseudonym) {
                <div cdkDrag [cdkDragData]="item.dev" class="cdk-drag-item">
                  <ss-developer-card
                    [dev]="item.dev"
                    [showRemove]="true"
                    [allocationPercent]="item.allocationPercent"
                    [maxAllocation]="maxForDev(item.dev, scenario.externalId)"
                    (remove)="removeDev($event, scenario.externalId)"
                    (allocationChange)="onAllocationChange($event, item.dev, scenario.externalId)"
                    (keyboardActivate)="openKeyboardDialog($event)"
                  />
                  <div class="cdk-drag-placeholder" *cdkDragPlaceholder>
                    <div class="h-16 rounded-lg border-2 border-dashed border-brand-primary/40 bg-brand-primary/5"></div>
                  </div>
                </div>
              }

              @if (!allocatedForScenario(scenario.externalId).length) {
                <div class="flex items-center justify-center h-20 text-xs text-content-muted border-2 border-dashed border-surface-overlay rounded-lg">
                  Drop developers here
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      opacity: 0.85;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      border-radius: 8px;
      background: var(--surface-overlay);
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0,0,0.2,1);
    }
    .cdk-drop-list-dragging .cdk-drag-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0,0,0.2,1);
    }
  `],
})
export class AllocationBoardComponent implements OnInit {
  readonly forecastState = inject(ForecastStateService);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  /** Local mutable copy of allocated devs keyed by scenarioExternalId */
  private readonly allocatedMap = signal<Map<string, AllocatedDev[]>>(new Map());

  /** Debounce subject for allocation slider changes */
  private readonly allocationChange$ = new Subject<{ dev: Developer; scenarioExternalId: string; percent: number }>();

  readonly columnTemplate = computed(() => {
    const count = this.forecastState.activeScenarios().length + 1; // +1 bench
    return `repeat(${count}, minmax(0, 1fr))`;
  });

  readonly allDropListIds = computed(() => {
    const ids = ['bench'];
    for (const s of this.forecastState.activeScenarios()) {
      ids.push(`scenario-${s.externalId}`);
    }
    return ids;
  });

  /** Bench = developers not fully allocated (based on forecastState.developers and current allocations) */
  readonly bench = computed(() => {
    const devs = this.forecastState.developers();
    const allocs = this.forecastState.allocations();
    // Sum up each dev's total allocated percent across all scenarios
    const totalAllocated = new Map<string, number>();
    for (const a of allocs) {
      totalAllocated.set(a.devPseudonym, (totalAllocated.get(a.devPseudonym) ?? 0) + a.allocationPercent);
    }
    return devs.filter(d => {
      const allocated = totalAllocated.get(d.pseudonym) ?? 0;
      return allocated < 100;
    }).map(d => {
      const allocated = totalAllocated.get(d.pseudonym) ?? 0;
      return { ...d, availablePercent: 100 - allocated } as Developer;
    });
  });

  allocatedForScenario(scenarioExternalId: string): AllocatedDev[] {
    return this.allocatedMap().get(scenarioExternalId) ?? [];
  }

  scenarioSummary(scenarioExternalId: string): string {
    const items = this.allocatedForScenario(scenarioExternalId);
    const total = items.reduce((sum, i) => sum + i.allocationPercent, 0);
    return `${items.length} dev${items.length !== 1 ? 's' : ''} · ${total}%`;
  }

  maxForDev(dev: Developer, currentScenarioExternalId: string): number {
    const allocs = this.forecastState.allocations();
    const totalElsewhere = allocs
      .filter(a => a.devPseudonym === dev.pseudonym && a.scenarioExternalId !== currentScenarioExternalId)
      .reduce((sum, a) => sum + a.allocationPercent, 0);
    return Math.max(5, 100 - totalElsewhere);
  }

  ngOnInit(): void {
    this.rebuildAllocatedMap();

    // Debounce allocation slider → API update → re-forecast
    this.allocationChange$.pipe(debounceTime(300)).subscribe(({ dev, scenarioExternalId, percent }) => {
      this.api.updateAllocation({
        devPseudonym: dev.pseudonym,
        scenarioExternalId,
        allocationPercent: percent,
      }).subscribe({
        next: () => {
          // Update forecastState.allocations
          const allocs = this.forecastState.allocations().map(a =>
            a.devPseudonym === dev.pseudonym && a.scenarioExternalId === scenarioExternalId
              ? { ...a, allocationPercent: percent }
              : a
          );
          this.forecastState.allocations.set(allocs);
          this.triggerForecast();
        },
      });
    });
  }

  private rebuildAllocatedMap(): void {
    const allocs = this.forecastState.allocations();
    const devs = this.forecastState.developers();
    const devMap = new Map(devs.map(d => [d.pseudonym, d]));
    const newMap = new Map<string, AllocatedDev[]>();

    for (const alloc of allocs) {
      const dev = devMap.get(alloc.devPseudonym);
      if (!dev) continue;
      const key = alloc.scenarioExternalId;
      if (!newMap.has(key)) newMap.set(key, []);
      newMap.get(key)!.push({ dev, allocationPercent: alloc.allocationPercent, scenarioExternalId: key });
    }

    this.allocatedMap.set(newMap);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDrop(event: CdkDragDrop<any>, targetScenario: Scenario | null): void {
    const dev: Developer = event.item.data;
    const sourceListId: string = event.previousContainer.id;
    const targetListId: string = event.container.id;

    if (sourceListId === targetListId) {
      // Reorder within same list — no API call needed
      if (targetScenario) {
        const items = [...this.allocatedForScenario(targetScenario.externalId)];
        const fromIdx = event.previousIndex;
        const toIdx = event.currentIndex;
        const moved = items.splice(fromIdx, 1)[0];
        items.splice(toIdx, 0, moved);
        this.setScenarioItems(targetScenario.externalId, items);
      }
      return;
    }

    const fromScenarioId = sourceListId.startsWith('scenario-') ? sourceListId.replace('scenario-', '') : null;

    if (targetListId === 'bench') {
      // Dropped back to bench — remove allocation
      if (fromScenarioId) {
        this.removeDev(dev, fromScenarioId);
      }
      return;
    }

    // Dropped onto a scenario column
    const targetScenarioId = targetListId.replace('scenario-', '');
    const available = this.maxForDev(dev, targetScenarioId);

    if (available <= 0) {
      this.snackBar.open(
        `${dev.pseudonym} is fully allocated. Remove from another scenario first.`,
        'Dismiss',
        { duration: 4000, panelClass: ['bg-surface-raised', 'text-content'] }
      );
      return;
    }

    // If moving from another scenario, remove first
    if (fromScenarioId) {
      this.doRemoveFromScenario(dev.pseudonym, fromScenarioId, false);
    }

    const dialogData: AllocationDialogData = {
      developer: dev,
      availableScenarios: this.forecastState.activeScenarios(),
      targetScenarioExternalId: targetScenarioId,
      maxPercent: available,
    };

    this.dialog.open<AllocationDialogComponent, AllocationDialogData, AllocationDialogResult>(
      AllocationDialogComponent,
      { data: dialogData, width: '420px', panelClass: 'dark-dialog' }
    ).afterClosed().subscribe(result => {
      if (!result) {
        // Cancelled — if we removed from another scenario, restore it
        if (fromScenarioId) {
          const existingAlloc = this.forecastState.allocations().find(
            a => a.devPseudonym === dev.pseudonym && a.scenarioExternalId === fromScenarioId
          );
          if (existingAlloc) {
            this.rebuildAllocatedMap();
          }
        }
        return;
      }
      this.doAllocate(dev, result.scenarioExternalId, result.allocationPercent, fromScenarioId ?? undefined);
    });
  }

  openKeyboardDialog(dev: Developer): void {
    const available = this.maxForDev(dev, '');
    if (available <= 0) {
      this.snackBar.open(
        `${dev.pseudonym} is fully allocated. Remove from a scenario first.`,
        'Dismiss',
        { duration: 4000 }
      );
      return;
    }

    const dialogData: AllocationDialogData = {
      developer: dev,
      availableScenarios: this.forecastState.activeScenarios(),
      targetScenarioExternalId: null,
      maxPercent: available,
    };

    this.dialog.open<AllocationDialogComponent, AllocationDialogData, AllocationDialogResult>(
      AllocationDialogComponent,
      { data: dialogData, width: '420px', panelClass: 'dark-dialog' }
    ).afterClosed().subscribe(result => {
      if (!result) return;
      this.doAllocate(dev, result.scenarioExternalId, result.allocationPercent);
    });
  }

  removeDev(dev: Developer, scenarioExternalId: string): void {
    this.doRemoveFromScenario(dev.pseudonym, scenarioExternalId, true);
  }

  onAllocationChange(percent: number, dev: Developer, scenarioExternalId: string): void {
    // Optimistically update local map
    const items = this.allocatedForScenario(scenarioExternalId).map(item =>
      item.dev.pseudonym === dev.pseudonym ? { ...item, allocationPercent: percent } : item
    );
    this.setScenarioItems(scenarioExternalId, items);
    this.allocationChange$.next({ dev, scenarioExternalId, percent });
  }

  private doAllocate(dev: Developer, scenarioExternalId: string, percent: number, removedFromScenario?: string): void {
    this.api.updateAllocation({ devPseudonym: dev.pseudonym, scenarioExternalId, allocationPercent: percent })
      .subscribe({
        next: () => {
          // If we also removed from another scenario via drag, delete that allocation
          if (removedFromScenario) {
            this.api.deleteAllocation(removedFromScenario, dev.pseudonym).subscribe();
          }

          // Update state
          const allocs = this.forecastState.allocations().filter(
            a => !(a.devPseudonym === dev.pseudonym && a.scenarioExternalId === removedFromScenario)
          );
          const existing = allocs.findIndex(a => a.devPseudonym === dev.pseudonym && a.scenarioExternalId === scenarioExternalId);
          if (existing >= 0) {
            allocs[existing] = { ...allocs[existing], allocationPercent: percent };
          } else {
            allocs.push({ devPseudonym: dev.pseudonym, scenarioExternalId, allocationPercent: percent });
          }
          this.forecastState.allocations.set([...allocs]);
          this.rebuildAllocatedMap();
          this.triggerForecast();
        },
        error: () => {
          this.snackBar.open('Failed to save allocation. Please try again.', 'Dismiss', { duration: 3000 });
          this.rebuildAllocatedMap();
        },
      });
  }

  private doRemoveFromScenario(devPseudonym: string, scenarioExternalId: string, callApi: boolean): void {
    if (callApi) {
      this.api.deleteAllocation(scenarioExternalId, devPseudonym).subscribe({
        next: () => {
          this.forecastState.allocations.set(
            this.forecastState.allocations().filter(
              a => !(a.devPseudonym === devPseudonym && a.scenarioExternalId === scenarioExternalId)
            )
          );
          this.rebuildAllocatedMap();
          this.triggerForecast();
        },
        error: () => {
          this.snackBar.open('Failed to remove allocation.', 'Dismiss', { duration: 3000 });
        },
      });
    } else {
      // Optimistic local-only removal (during drag)
      const items = this.allocatedForScenario(scenarioExternalId).filter(
        item => item.dev.pseudonym !== devPseudonym
      );
      this.setScenarioItems(scenarioExternalId, items);
    }
  }

  private setScenarioItems(scenarioExternalId: string, items: AllocatedDev[]): void {
    const newMap = new Map(this.allocatedMap());
    newMap.set(scenarioExternalId, items);
    this.allocatedMap.set(newMap);
  }

  private triggerForecast(): void {
    const ids = this.forecastState.activeScenarioIds();
    if (!ids.length) return;
    this.forecastState.isForecastLoading.set(true);
    this.api.computeForecast({
      scenarioIds: ids,
      priorityPressure: this.forecastState.priorityPressure(),
      scopePercent: this.forecastState.scopePercent(),
      contingencyBuffer: this.forecastState.contingencyBuffer(),
      allocations: this.forecastState.allocations(),
    }).subscribe({
      next: (res) => {
        // Support both wrapped {data: ...} and unwrapped responses
        const data = (res as any).data ?? res;
        this.forecastState.forecastResults.set(data.results);
        this.forecastState.winner.set(data.winner);
        this.forecastState.isForecastLoading.set(false);
      },
      error: () => this.forecastState.isForecastLoading.set(false),
    });
  }
}
