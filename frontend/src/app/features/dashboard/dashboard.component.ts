import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface Project {
  id: string;
  name: string;
  status: string;
}

@Component({
  selector: 'ss-dashboard',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <h1 class="text-2xl font-semibold mb-4">Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      @for (p of projects(); track p.id) {
        <mat-card class="p-4">
          <div class="font-semibold">{{ p.name }}</div>
          <div class="text-sm text-gray-500">{{ p.status }}</div>
        </mat-card>
      } @empty {
        <div class="text-gray-500">No projects yet.</div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly projects = signal<Project[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.get<{ data: Project[] }>('/projects'));
      this.projects.set(res.data);
    } catch {
      this.projects.set([]);
    }
  }
}
