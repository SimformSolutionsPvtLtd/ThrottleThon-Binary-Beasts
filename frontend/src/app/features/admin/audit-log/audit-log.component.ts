import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader.component';
import { AuditLog } from '../../../core/models/tenant.model';

@Component({
  selector: 'ss-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-base font-semibold text-content">Audit Log</h3>
        <button mat-stroked-button (click)="exportCsv()" [disabled]="visibleRows().length === 0" class="text-content">
          <mat-icon>download</mat-icon>
          Export CSV
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-surface-raised rounded-xl p-4 border border-surface-overlay flex flex-wrap items-center gap-3">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>Action</mat-label>
          <mat-select [(ngModel)]="actionFilter" (selectionChange)="reload()">
            <mat-option [value]="''">All actions</mat-option>
            @for (a of actionOptions(); track a) {
              <mat-option [value]="a">{{ a }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-label>Start date</mat-label>
          <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="reload()" />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-label>End date</mat-label>
          <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="reload()" />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 min-w-48">
          <mat-label>Search (this page)</mat-label>
          <mat-icon matPrefix class="text-content-muted mr-1">search</mat-icon>
          <input matInput [(ngModel)]="searchTerm" placeholder="Action, resource, user…" />
        </mat-form-field>

        @if (hasActiveFilters()) {
          <button mat-button (click)="clearFilters()" class="text-content-muted">
            <mat-icon>clear</mat-icon> Clear
          </button>
        }
      </div>

      @if (loading()) {
        <ss-skeleton type="table" [rows]="8" />
      } @else if (visibleRows().length === 0) {
        <div class="bg-surface-raised rounded-xl p-12 text-center border border-surface-overlay">
          <p class="text-content-muted">No audit entries match the current filters.</p>
        </div>
      } @else {
        <div class="bg-surface-raised rounded-xl border border-surface-overlay overflow-hidden">
          <!-- Header row -->
          <div class="grid grid-cols-[180px_160px_1fr_1fr_90px] gap-2 px-4 py-2 bg-surface text-xs uppercase tracking-wide text-content-muted border-b border-surface-overlay">
            <span>Timestamp</span><span>User</span><span>Action</span><span>Resource</span><span>PII</span>
          </div>

          <mat-accordion displayMode="flat" class="block">
            @for (row of visibleRows(); track row.id) {
              <mat-expansion-panel class="ss-audit-panel" [hideToggle]="false">
                <mat-expansion-panel-header class="ss-audit-header">
                  <mat-panel-title>
                    <div class="grid grid-cols-[180px_160px_1fr_1fr_90px] gap-2 w-full items-center text-sm">
                      <span class="text-content-muted">{{ row.createdAt | date: 'short' }}</span>
                      <span class="text-content truncate">{{ row.userId ? row.userId : 'System' }}</span>
                      <span class="text-content">{{ row.action }}</span>
                      <span class="text-content-muted truncate">{{ row.resource }}</span>
                      <span>
                        @if (row.piiSanitised) {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓</span>
                        } @else {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">✗</span>
                        }
                      </span>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <pre class="text-xs text-content-muted bg-surface rounded-lg p-3 overflow-auto whitespace-pre-wrap">{{ formatDetails(row) }}</pre>
              </mat-expansion-panel>
            }
          </mat-accordion>

          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex()"
            [pageSizeOptions]="[25, 50, 100]"
            (page)="onPage($event)"
            showFirstLastButtons
            class="bg-surface-raised border-t border-surface-overlay"
          ></mat-paginator>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .ss-audit-panel {
      background: transparent !important; box-shadow: none !important;
      border-bottom: 1px solid rgba(51,65,85,0.5);
    }
    :host ::ng-deep .ss-audit-panel .mat-expansion-panel-header { padding: 0 16px; height: auto; min-height: 44px; }
    :host ::ng-deep .ss-audit-panel .mat-expansion-panel-body { padding: 0 16px 12px; }
  `],
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly logs = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly loading = signal(true);
  readonly pageSize = 25;

  // Filters
  actionFilter = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  searchTerm = '';

  // Distinct action values from the current page (best-effort for the dropdown).
  readonly actionOptions = computed(() =>
    [...new Set(this.logs().map(l => l.action))].sort()
  );

  // Client-side text filter over the loaded page.
  readonly visibleRows = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.logs();
    return this.logs().filter(l =>
      l.action.toLowerCase().includes(term) ||
      l.resource.toLowerCase().includes(term) ||
      (l.userId ?? 'system').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.fetch();
  }

  reload(): void {
    this.pageIndex.set(0);
    this.fetch();
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    const filters: Record<string, string> = {
      page: String(this.pageIndex() + 1),
      limit: String(this.pageSize),
    };
    if (this.actionFilter) filters['action'] = this.actionFilter;
    if (this.startDate) filters['startDate'] = this.startDate.toISOString();
    if (this.endDate) filters['endDate'] = this.endDate.toISOString();

    this.api.getAuditLogs(filters).subscribe({
      next: (page) => {
        this.logs.set(page.data ?? []);
        this.total.set(page.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.actionFilter || this.startDate || this.endDate || this.searchTerm);
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.startDate = null;
    this.endDate = null;
    this.searchTerm = '';
    this.reload();
  }

  formatDetails(row: AuditLog): string {
    const payload = {
      id: row.id,
      action: row.action,
      resource: row.resource,
      user: row.userId ?? 'System',
      ipAddress: row.ipAddress,
      piiSanitised: row.piiSanitised,
      createdAt: row.createdAt,
      details: row.details ?? null,
    };
    return JSON.stringify(payload, null, 2);
  }

  exportCsv(): void {
    const rows = this.visibleRows();
    const header = ['Timestamp', 'User', 'Action', 'Resource', 'PII Sanitised', 'IP Address', 'Details'];
    const escape = (v: unknown): string => {
      const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = rows.map(r => [
      r.createdAt, r.userId ?? 'System', r.action, r.resource,
      r.piiSanitised ? 'Yes' : 'No', r.ipAddress ?? '', r.details,
    ].map(escape).join(','));
    const csv = [header.map(escape).join(','), ...lines].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-page-${this.pageIndex() + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
