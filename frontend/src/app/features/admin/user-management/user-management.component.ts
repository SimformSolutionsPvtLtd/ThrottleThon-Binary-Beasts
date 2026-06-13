import { ChangeDetectionStrategy, Component, inject, signal, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog.component';
import { InviteUserDialogComponent } from './invite-user-dialog.component';
import { TenantMember, AddMemberRequest } from '../../../core/models/tenant.model';
import { ASSIGNABLE_ROLES } from '../../../core/models/roles';

@Component({
  selector: 'ss-user-management',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-base font-semibold text-content">Team Members</h3>
        <button mat-raised-button color="primary" (click)="invite()">
          <mat-icon>person_add</mat-icon>
          Invite User
        </button>
      </div>

      @if (loading()) {
        <ss-skeleton type="table" [rows]="6" />
      } @else if (members().length === 0) {
        <div class="bg-surface-raised rounded-xl p-12 text-center border border-surface-overlay">
          <p class="text-content-muted">No members found.</p>
        </div>
      } @else {
        <div class="bg-surface-raised rounded-xl overflow-hidden border border-surface-overlay">
          <table mat-table [dataSource]="dataSource" matSort class="w-full ss-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let m" class="text-content">{{ m.firstName }} {{ m.lastName }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let m" class="text-content-muted">{{ m.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let m">
                <mat-select
                  [value]="m.role.name"
                  (selectionChange)="changeRole(m, $event.value)"
                  class="ss-role-select text-sm"
                  panelClass="ss-select-panel"
                >
                  @for (r of roles; track r.value) {
                    <mat-option [value]="r.value">{{ r.label }}</mat-option>
                  }
                </mat-select>
              </td>
            </ng-container>

            <ng-container matColumnDef="joinedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Joined</th>
              <td mat-cell *matCellDef="let m" class="text-content-muted">{{ m.joinedAt | date: 'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let m">
                @if (m.isActive) {
                  <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                } @else {
                  <span class="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-content-muted">Inactive</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
              <td mat-cell *matCellDef="let m" class="text-right">
                <button
                  mat-icon-button
                  [disabled]="!m.isActive"
                  (click)="deactivate(m)"
                  matTooltip="Deactivate member"
                  class="text-content-muted"
                >
                  <mat-icon>person_off</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50]" pageSize="10" showFirstLastButtons class="bg-surface-raised border-t border-surface-overlay"></mat-paginator>
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
    :host ::ng-deep .ss-table td.mat-mdc-cell { border-bottom-color: rgba(51,65,85,0.5); }
    :host ::ng-deep .ss-role-select .mat-mdc-select-value { color: var(--content, #E2E8F0); }
    :host ::ng-deep .ss-role-select .mat-mdc-select-arrow { color: var(--content-muted, #94A3B8); }
  `],
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly members = signal<TenantMember[]>([]);
  readonly loading = signal(true);
  readonly roles = ASSIGNABLE_ROLES;
  readonly columns = ['name', 'email', 'role', 'joinedAt', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<TenantMember>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = (m, prop) => {
      switch (prop) {
        case 'name': return `${m.firstName} ${m.lastName}`.toLowerCase();
        case 'joinedAt': return new Date(m.joinedAt).getTime();
        default: return (m as unknown as Record<string, string>)[prop];
      }
    };
    this.dataSource.sort = this.sort;
  }

  private load(): void {
    this.loading.set(true);
    this.api.getMembers().subscribe({
      next: (res) => {
        this.members.set(res);
        this.dataSource.data = res;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeRole(member: TenantMember, roleName: string): void {
    if (roleName === member.role.name) return;
    this.api.updateMemberRole(member.userId, roleName).subscribe({
      next: () => {
        this.snackBar.open(`Role updated for ${member.email}.`, 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: () => this.load(), // revert the select to server truth
    });
  }

  deactivate(member: TenantMember): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Deactivate member',
          message: `Remove ${member.firstName} ${member.lastName} (${member.email}) from this tenant? Their sessions will be revoked.`,
          confirmText: 'Deactivate',
          destructive: true,
        } as ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((ok?: boolean) => {
        if (!ok) return;
        this.api.removeMember(member.userId).subscribe({
          next: () => {
            this.snackBar.open('Member deactivated.', 'Dismiss', { duration: 3000 });
            this.load();
          },
          error: () => {},
        });
      });
  }

  invite(): void {
    this.dialog
      .open(InviteUserDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((result?: AddMemberRequest) => {
        if (!result) return;
        this.api.addMember(result).subscribe({
          next: () => {
            this.snackBar.open(`Invited ${result.email}.`, 'Dismiss', { duration: 3000 });
            this.load();
          },
          error: () => {},
        });
      });
  }
}
