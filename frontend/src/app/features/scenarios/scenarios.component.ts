import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface Scenario {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

@Component({
  selector: 'ss-scenarios',
  standalone: true,
  imports: [MatTableModule, MatButtonModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Scenarios</h1>
      <button mat-flat-button color="primary" (click)="refresh()">Refresh</button>
    </div>
    <table mat-table [dataSource]="rows()" class="w-full bg-white shadow rounded">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let r">{{ r.name }}</td>
      </ng-container>
      <ng-container matColumnDef="category">
        <th mat-header-cell *matHeaderCellDef>Category</th>
        <td mat-cell *matCellDef="let r">{{ r.category }}</td>
      </ng-container>
      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef>Created</th>
        <td mat-cell *matCellDef="let r">{{ r.createdAt | date }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
  `,
})
export class ScenariosComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly rows = signal<Scenario[]>([]);
  readonly cols = ['name', 'category', 'createdAt'];

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    const res = await firstValueFrom(this.api.get<{ data: Scenario[] }>('/scenarios'));
    this.rows.set(res.data);
  }
}
