import { Component, inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ForecastStateService } from '../../../core/services/forecast-state.service';
import { ApiService } from '../../../core/services/api.service';
import { ResolvePseudonymPipe } from '../../../shared/pipes/resolve-pseudonym.pipe';
import { Developer } from '../../../core/models/developer.model';

@Component({
  selector: 'ss-developers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatTooltipModule,
    ResolvePseudonymPipe,
  ],
  template: `
    <div class="space-y-4">
      <!-- Header + Search -->
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-content">Developers</h2>
        <mat-form-field appearance="outline" class="w-72" subscriptSizing="dynamic">
          <mat-label>Search developers</mat-label>
          <mat-icon matPrefix class="text-content-muted mr-1">search</mat-icon>
          <input matInput [(ngModel)]="filterValue" (ngModelChange)="applyFilter($event)" placeholder="Name, role, department…" />
        </mat-form-field>
      </div>

      <div class="bg-surface-raised rounded-xl overflow-hidden">
        <mat-table [dataSource]="dataSource" matSort class="w-full">

          <!-- Pseudonym -->
          <ng-container matColumnDef="pseudonym">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Name</mat-header-cell>
            <mat-cell *matCellDef="let dev" class="text-content font-medium">
              {{ dev.pseudonym | resolveName }}
            </mat-cell>
          </ng-container>

          <!-- Role -->
          <ng-container matColumnDef="role">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Role</mat-header-cell>
            <mat-cell *matCellDef="let dev" class="text-content-muted text-sm">{{ dev.role }}</mat-cell>
          </ng-container>

          <!-- Department -->
          <ng-container matColumnDef="department">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Dept</mat-header-cell>
            <mat-cell *matCellDef="let dev" class="text-content-muted text-sm">{{ dev.department }}</mat-cell>
          </ng-container>

          <!-- Tenure -->
          <ng-container matColumnDef="tenureYears">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Tenure</mat-header-cell>
            <mat-cell *matCellDef="let dev" class="text-content-muted text-sm">{{ dev.tenureYears }}y</mat-cell>
          </ng-container>

          <!-- Cost Band -->
          <ng-container matColumnDef="costBand">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Band</mat-header-cell>
            <mat-cell *matCellDef="let dev">
              <span [class]="costBandClass(dev.costBand)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ dev.costBand }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Skills -->
          <ng-container matColumnDef="skills">
            <mat-header-cell *matHeaderCellDef class="text-content-muted text-xs font-medium uppercase tracking-wide">Skills</mat-header-cell>
            <mat-cell *matCellDef="let dev">
              <div class="flex flex-wrap gap-1 py-1">
                @for (skill of dev.skills.slice(0, 3); track skill.tech) {
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-surface-overlay text-content-muted flex items-center gap-1"
                    [matTooltip]="skill.tech + ' · ' + proficiencyLabel(skill.proficiency)"
                  >
                    {{ skill.tech }}
                    <span class="flex gap-0.5">
                      @for (dot of proficiencyDots(skill.proficiency); track $index) {
                        <span class="w-1 h-1 rounded-full" [class.bg-brand-accent]="dot" [class.bg-surface-overlay]="!dot"></span>
                      }
                    </span>
                  </span>
                }
                @if (dev.skills.length > 3) {
                  <span class="text-xs text-content-muted">+{{ dev.skills.length - 3 }}</span>
                }
              </div>
            </mat-cell>
          </ng-container>

          <!-- Allocation -->
          <ng-container matColumnDef="allocation">
            <mat-header-cell *matHeaderCellDef mat-sort-header class="text-content-muted text-xs font-medium uppercase tracking-wide">Allocation</mat-header-cell>
            <mat-cell *matCellDef="let dev">
              <div class="w-full max-w-32">
                <div class="flex justify-between text-xs text-content-muted mb-0.5">
                  <span>{{ dev.currentAllocation.project }}</span>
                  <span>{{ dev.currentAllocation.percent }}%</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="dev.currentAllocation.percent"
                  [color]="dev.currentAllocation.percent >= 90 ? 'warn' : 'primary'"
                  class="rounded"
                ></mat-progress-bar>
              </div>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns" class="bg-surface border-b border-surface-overlay"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-surface-overlay/50 transition-colors border-b border-surface-overlay/50"></mat-row>

          <!-- No data -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center text-content-muted py-8" [attr.colspan]="displayedColumns.length">
              @if (filterValue) {
                No developers match "{{ filterValue }}"
              } @else {
                No developers found
              }
            </td>
          </tr>
        </mat-table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50]"
          pageSize="10"
          showFirstLastButtons
          class="bg-surface-raised border-t border-surface-overlay"
        ></mat-paginator>
      </div>
    </div>
  `,
})
export class DevelopersListComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ApiService);
  readonly forecastState = inject(ForecastStateService);

  readonly displayedColumns = ['pseudonym', 'role', 'department', 'tenureYears', 'costBand', 'skills', 'allocation'];
  readonly dataSource = new MatTableDataSource<Developer>([]);
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    // Use cached developers if already loaded, otherwise fetch
    const cached = this.forecastState.developers();
    if (cached.length) {
      this.dataSource.data = cached;
    } else {
      this.api.getDevelopers().subscribe(res => {
        this.forecastState.developers.set(res);
        this.dataSource.data = res;
        this.attachSortAndPaginator();
      });
    }
  }

  ngAfterViewInit(): void {
    this.attachSortAndPaginator();
  }

  private attachSortAndPaginator(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (dev: Developer, filter: string) => {
      const term = filter.toLowerCase();
      const resolved = this.forecastState.resolvedName()(dev.pseudonym).toLowerCase();
      return (
        resolved.includes(term) ||
        dev.role.toLowerCase().includes(term) ||
        dev.department.toLowerCase().includes(term) ||
        dev.costBand.toLowerCase().includes(term) ||
        dev.skills.some(s => s.tech.toLowerCase().includes(term))
      );
    };
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  costBandClass(band: string): string {
    const map: Record<string, string> = {
      C1: 'bg-surface-overlay text-content-muted',
      C2: 'bg-blue-500/20 text-blue-400',
      C3: 'bg-yellow-500/20 text-yellow-400',
      C4: 'bg-orange-500/20 text-orange-400',
      C5: 'bg-red-500/20 text-red-400',
    };
    return map[band] ?? 'bg-surface-overlay text-content-muted';
  }

  proficiencyDots(proficiency: number): boolean[] {
    // proficiency 1-5, return array of 5 booleans
    return [1, 2, 3, 4, 5].map(i => i <= proficiency);
  }

  proficiencyLabel(proficiency: number): string {
    const labels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[proficiency] ?? `${proficiency}/5`;
  }
}
