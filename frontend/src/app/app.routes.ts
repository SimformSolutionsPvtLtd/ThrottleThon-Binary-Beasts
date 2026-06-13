import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { title: 'Dashboard' } },
      { path: 'scenarios', loadComponent: () => import('./features/scenarios/scenarios-list/scenarios-list.component').then(m => m.ScenariosListComponent), data: { title: 'Scenarios' } },
      { path: 'developers', loadComponent: () => import('./features/developers/developers-list/developers-list.component').then(m => m.DevelopersListComponent), data: { title: 'Developers' } },
      { path: 'allocations', loadComponent: () => import('./features/allocations/allocation-board/allocation-board.component').then(m => m.AllocationBoardComponent), data: { title: 'Allocations' } },
      { path: 'debate/:scenarioExternalId', loadComponent: () => import('./features/debate/debate-timeline/debate-timeline.component').then(m => m.DebateTimelineComponent), data: { title: 'Debate' } },
      { path: 'brief/:scenarioExternalId', loadComponent: () => import('./features/brief/brief.component').then(m => m.BriefComponent), data: { title: 'Brief' } },
      {
        path: 'admin',
        canActivate: [permissionGuard],
        data: { permissions: ['admin', 'super_admin'], title: 'Admin' },
        loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent), data: { title: 'Users' } },
          { path: 'tenant', loadComponent: () => import('./features/admin/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent), data: { title: 'Tenant Settings' } },
          { path: 'audit', loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent), data: { title: 'Audit Log' } },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
