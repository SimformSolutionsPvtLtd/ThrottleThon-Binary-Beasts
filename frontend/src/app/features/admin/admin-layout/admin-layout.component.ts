import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'ss-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <div class="text-content">
      <h2 class="text-xl font-semibold mb-4">Admin</h2>
      <nav class="flex gap-4 border-b border-surface-overlay mb-6 pb-2">
        <a routerLink="users" routerLinkActive="text-brand-accent border-b-2 border-brand-primary" class="text-content-muted pb-2 hover:text-content transition-colors">Users</a>
        <a routerLink="tenant" routerLinkActive="text-brand-accent border-b-2 border-brand-primary" class="text-content-muted pb-2 hover:text-content transition-colors">Tenant</a>
        <a routerLink="audit" routerLinkActive="text-brand-accent border-b-2 border-brand-primary" class="text-content-muted pb-2 hover:text-content transition-colors">Audit Log</a>
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AdminLayoutComponent {}
