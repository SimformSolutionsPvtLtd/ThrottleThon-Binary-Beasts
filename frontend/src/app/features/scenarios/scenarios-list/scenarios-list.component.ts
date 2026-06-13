import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ForecastStateService } from '../../../core/services/forecast-state.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader.component';
import { Scenario } from '../../../core/models/scenario.model';
import {
  ScenarioFormDialogComponent,
  ScenarioFormData,
  ScenarioFormResult,
} from './scenario-form-dialog.component';

@Component({
  selector: 'ss-scenarios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-content">Scenarios</h2>
        @if (canWrite()) {
          <button mat-raised-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon>
            Create Scenario
          </button>
        }
      </div>

      @if (loading()) {
        <ss-skeleton type="table" [rows]="5" />
      } @else if (scenarios().length === 0) {
        <div class="bg-surface-raised rounded-xl p-12 text-center border border-surface-overlay">
          <mat-icon class="text-content-muted mb-2" style="font-size:36px;width:36px;height:36px;">compare_arrows</mat-icon>
          <p class="text-content font-medium">No scenarios configured.</p>
          <p class="text-content-muted text-sm mt-1">Contact your admin{{ canWrite() ? ' or create one above' : '' }}.</p>
        </div>
      } @else {
        <div class="bg-surface-raised rounded-xl overflow-hidden border border-surface-overlay">
          <table mat-table [dataSource]="scenarios()" class="w-full ss-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let s">
                <div class="text-content font-medium">{{ s.name }}</div>
                <div class="text-xs text-content-muted truncate max-w-md">{{ s.description }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let s">
                <span class="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted capitalize">{{ s.category }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="baseEffort">
              <th mat-header-cell *matHeaderCellDef>Base Effort</th>
              <td mat-cell *matCellDef="let s" class="text-content-muted">{{ s.baseEffortPoints }} pts</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                @if (s.isActive) {
                  <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                } @else {
                  <span class="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted">Inactive</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
              <td mat-cell *matCellDef="let s" class="text-right">
                <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()" class="text-content-muted">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="view(s)">
                    <mat-icon>visibility</mat-icon><span>View details</span>
                  </button>
                  @if (canWrite()) {
                    <button mat-menu-item (click)="openEdit(s)">
                      <mat-icon>edit</mat-icon><span>Edit</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columns"
              class="cursor-pointer hover:bg-surface-overlay/40 transition-colors"
              (click)="view(row)"
            ></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .ss-table { background: transparent; }
    :host ::ng-deep .ss-table th.mat-mdc-header-cell {
      background: var(--surface, #0F172A); color: var(--content-muted, #94A3B8);
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom-color: var(--surface-overlay, #334155);
    }
    :host ::ng-deep .ss-table td.mat-mdc-cell { border-bottom-color: rgba(51,65,85,0.5); color: var(--content, #E2E8F0); }
  `],
})
export class ScenariosListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly state = inject(ForecastStateService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly scenarios = signal<Scenario[]>([]);
  readonly loading = signal(true);
  readonly columns = ['name', 'category', 'baseEffort', 'status', 'actions'];

  canWrite(): boolean {
    return this.auth.hasPermission('scenarios:write');
  }

  ngOnInit(): void {
    const cached = this.state.allScenarios();
    if (cached.length) {
      this.scenarios.set(cached);
      this.loading.set(false);
    }
    this.load();
  }

  private load(): void {
    this.api.getScenarios().subscribe({
      next: (res) => {
        this.scenarios.set(res);
        this.state.allScenarios.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  view(s: Scenario): void {
    this.router.navigate(['/scenarios', s.externalId]);
  }

  openCreate(): void {
    this.dialog
      .open(ScenarioFormDialogComponent, { width: '640px', data: {} as ScenarioFormData, panelClass: 'ss-dialog' })
      .afterClosed()
      .subscribe((result?: ScenarioFormResult) => {
        if (!result) return;
        this.api.createScenario(result).subscribe({
          next: () => {
            this.snackBar.open('Scenario created.', 'Dismiss', { duration: 3000 });
            this.load();
          },
          error: () => {},
        });
      });
  }

  openEdit(s: Scenario): void {
    this.dialog
      .open(ScenarioFormDialogComponent, { width: '640px', data: { scenario: s } as ScenarioFormData, panelClass: 'ss-dialog' })
      .afterClosed()
      .subscribe((result?: ScenarioFormResult) => {
        if (!result) return;
        const { externalId, ...patch } = result;
        this.api.updateScenario(s.externalId, patch).subscribe({
          next: () => {
            this.snackBar.open('Scenario updated.', 'Dismiss', { duration: 3000 });
            this.load();
          },
          error: () => {},
        });
      });
  }
}
