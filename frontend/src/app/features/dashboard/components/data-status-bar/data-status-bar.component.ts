import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ForecastStateService } from '../../../../core/services/forecast-state.service';
import { SourceStatus } from '../../../../core/models/data-status.model';

@Component({
  selector: 'ss-data-status-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="flex flex-row gap-4 bg-surface-raised rounded-xl p-4 items-center flex-wrap">
      @if (forecastState.dataStatus(); as status) {
        <!-- Git -->
        <div class="flex items-center gap-3 flex-1 min-w-48">
          <mat-icon class="text-content-muted flex-shrink-0">code</mat-icon>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-sm font-medium text-content">Git</span>
              <span [class]="chipClass(status.sources.git.mode)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ status.sources.git.mode === 'sandbox' ? 'Sandbox' : 'Live' }}
              </span>
            </div>
            <span class="text-xs text-content-muted">
              {{ status.sources.git.repoCount ?? 0 }} repo{{ (status.sources.git.repoCount ?? 0) !== 1 ? 's' : '' }}
            </span>
          </div>
          <button mat-icon-button matTooltip="Refresh Git data" class="text-content-muted flex-shrink-0" (click)="refresh.emit('git')">
            <mat-icon class="text-base">refresh</mat-icon>
          </button>
        </div>

        <div class="w-px h-10 bg-surface-overlay flex-shrink-0"></div>

        <!-- Jira -->
        <div class="flex items-center gap-3 flex-1 min-w-48">
          <mat-icon class="text-content-muted flex-shrink-0">assignment</mat-icon>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-sm font-medium text-content">Jira</span>
              <span [class]="chipClass(status.sources.jira.mode)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ status.sources.jira.mode === 'sandbox' ? 'Sandbox' : 'Live' }}
              </span>
            </div>
            <span class="text-xs text-content-muted">
              {{ status.sources.jira.ticketCount ?? 0 }} tickets · {{ status.sources.jira.sprintCount ?? 0 }} sprints
            </span>
          </div>
          <button mat-icon-button matTooltip="Refresh Jira data" class="text-content-muted flex-shrink-0" (click)="refresh.emit('jira')">
            <mat-icon class="text-base">refresh</mat-icon>
          </button>
        </div>

        <div class="w-px h-10 bg-surface-overlay flex-shrink-0"></div>

        <!-- HRMS -->
        <div class="flex items-center gap-3 flex-1 min-w-48">
          <mat-icon class="text-content-muted flex-shrink-0">people</mat-icon>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-sm font-medium text-content">HRMS</span>
              <span [class]="chipClass(status.sources.hrms.mode)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ status.sources.hrms.mode === 'sandbox' ? 'Sandbox' : 'Live' }}
              </span>
            </div>
            <span class="text-xs text-content-muted">
              {{ status.sources.hrms.employeeCount ?? 0 }} employee{{ (status.sources.hrms.employeeCount ?? 0) !== 1 ? 's' : '' }}
            </span>
          </div>
          <button mat-icon-button matTooltip="Refresh HRMS data" class="text-content-muted flex-shrink-0" (click)="refresh.emit('hrms')">
            <mat-icon class="text-base">refresh</mat-icon>
          </button>
        </div>
      } @else {
        <!-- Skeleton -->
        @for (i of [1,2,3]; track i) {
          <div class="flex items-center gap-3 flex-1 min-w-48">
            <div class="w-6 h-6 rounded bg-surface-overlay animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="h-3 w-24 rounded bg-surface-overlay animate-pulse"></div>
              <div class="h-2.5 w-32 rounded bg-surface-overlay animate-pulse"></div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class DataStatusBarComponent {
  readonly forecastState = inject(ForecastStateService);
  readonly refresh = output<string>();

  chipClass(mode: SourceStatus['mode']): string {
    if (mode === 'live') return 'bg-green-500/20 text-green-400';
    return 'bg-amber-500/20 text-amber-400';
  }
}
