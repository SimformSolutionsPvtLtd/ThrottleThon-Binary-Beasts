import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'ss-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen">
      <mat-sidenav mode="side" opened class="w-60 bg-white border-r">
        <div class="p-4 font-semibold text-lg text-brand-700">SmarterSprint</div>
        <mat-nav-list>
          @for (item of nav; track item.path) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="bg-brand-50 text-brand-700">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="bg-white border-b">
          <span class="flex-1"></span>
          @if (auth.isAuthenticated()) {
            <button mat-icon-button (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
          }
        </mat-toolbar>
        <div class="p-6"><ng-content /></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly nav = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/scenarios', label: 'Scenarios', icon: 'science' },
    { path: '/allocations', label: 'Allocations', icon: 'groups' },
    { path: '/debate', label: 'Debate', icon: 'forum' },
    { path: '/reports', label: 'Reports', icon: 'description' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
}
