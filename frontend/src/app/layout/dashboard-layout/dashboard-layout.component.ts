import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { TenantBrandingService } from '../../core/services/tenant-branding.service';

@Component({
  selector: 'ss-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <!-- Viewport warning -->
    @if (viewportTooSmall()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface">
        <div class="text-center p-8 bg-surface-raised rounded-2xl max-w-md">
          <mat-icon class="text-6xl text-content-muted mb-4" style="font-size:64px;width:64px;height:64px;">desktop_windows</mat-icon>
          <h2 class="text-xl font-semibold text-content mb-2">Desktop Required</h2>
          <p class="text-content-muted">SmarterSprint requires a desktop browser (1280px+). Please resize your window or use a larger screen.</p>
        </div>
      </div>
    }

    <div class="flex h-screen bg-surface dark overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="flex flex-col bg-surface-raised border-r border-surface-overlay transition-all duration-200"
        [class.w-60]="!collapsed()"
        [class.w-16]="collapsed()"
      >
        <!-- Logo area -->
        <div class="flex items-center gap-3 p-4 border-b border-surface-overlay min-h-[64px]">
          @if (branding.branding()?.logoUrl && !collapsed()) {
            <img [src]="branding.branding()!.logoUrl!" alt="Logo" class="h-8 w-8 rounded object-contain" />
          } @else {
            <div class="h-8 w-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {{ (branding.branding()?.brandName || 'SS')[0] }}
            </div>
          }
          @if (!collapsed()) {
            <span class="font-semibold text-content truncate">{{ branding.branding()?.brandName || 'SmarterSprint' }}</span>
          }
        </div>

        <!-- Nav -->
        <nav class="flex-1 py-2 overflow-y-auto">
          @for (item of visibleNavItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-primary/20 text-brand-accent border-r-2 border-brand-primary"
              class="flex items-center gap-3 px-4 py-3 text-content-muted hover:text-content hover:bg-surface-overlay cursor-pointer transition-colors"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right"
            >
              <mat-icon class="flex-shrink-0 text-xl">{{ item.icon }}</mat-icon>
              @if (!collapsed()) {
                <span class="text-sm font-medium">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- User info -->
        <div class="border-t border-surface-overlay p-3">
          @if (!collapsed()) {
            <div class="flex items-center gap-2 mb-2 px-1">
              <div class="h-7 w-7 rounded-full bg-brand-primary/30 flex items-center justify-center text-xs text-brand-accent font-medium flex-shrink-0">
                {{ userInitial() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-content truncate">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</div>
                <div class="text-xs text-content-muted truncate capitalize">{{ auth.userRole() }}</div>
              </div>
            </div>
          }
          <button
            mat-icon-button
            (click)="auth.logout()"
            class="w-full"
            [matTooltip]="'Logout'"
            matTooltipPosition="right"
          >
            <mat-icon class="text-content-muted">logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex flex-col flex-1 min-w-0">
        <!-- Top bar -->
        <header class="flex items-center gap-4 px-6 bg-surface-raised border-b border-surface-overlay min-h-[64px]">
          <!-- Collapse toggle -->
          <button mat-icon-button (click)="collapsed.set(!collapsed())" class="text-content-muted">
            <mat-icon>{{ collapsed() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>

          <h1 class="text-lg font-semibold text-content flex-1">{{ pageTitle() }}</h1>

          <!-- Show Real Names toggle (only for identity-map:read) -->
          @if (auth.hasPermission('identity-map:read')) {
            <div class="flex items-center gap-2 text-sm text-content-muted">
              <span>Real Names</span>
              <mat-slide-toggle
                color="primary"
                [checked]="showRealNames()"
                (change)="onRealNamesToggle($event.checked)"
              ></mat-slide-toggle>
            </div>
          }

          <!-- User menu -->
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="text-content-muted">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu" class="bg-surface-raised">
            <div class="px-4 py-2 border-b border-surface-overlay">
              <div class="text-sm text-content font-medium">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</div>
              <div class="text-xs text-content-muted">{{ auth.currentUser()?.email }}</div>
            </div>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-auto p-6 bg-surface">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly branding = inject(TenantBrandingService);
  private readonly route = inject(ActivatedRoute);

  readonly collapsed = signal(false);
  readonly showRealNames = signal(false);
  readonly viewportTooSmall = signal(window.innerWidth < 1280);

  @HostListener('window:resize')
  onResize(): void {
    this.viewportTooSmall.set(window.innerWidth < 1280);
  }

  readonly pageTitle = computed(() => {
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    return r.snapshot.data?.['title'] ?? 'Dashboard';
  });

  readonly navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/scenarios', label: 'Scenarios', icon: 'compare_arrows' },
    { path: '/developers', label: 'Developers', icon: 'group' },
    { path: '/allocations', label: 'Allocations', icon: 'drag_indicator' },
    { path: '/admin', label: 'Admin', icon: 'settings', adminOnly: true },
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.auth.userRole();
    const isAdmin = role === 'admin' || role === 'super_admin';
    return this.navItems.filter(item => !item.adminOnly || isAdmin);
  });

  readonly userInitial = computed(() => {
    const u = this.auth.currentUser();
    return u?.firstName?.[0]?.toUpperCase() ?? '?';
  });

  onRealNamesToggle(_checked: boolean): void {
    this.showRealNames.set(_checked);
  }
}
