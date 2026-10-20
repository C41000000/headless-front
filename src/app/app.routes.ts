import { Routes } from '@angular/router';
import { centralAuthGuard } from './features/central/auth/guards/central-auth.guard';
import { centralGuestGuard } from './features/central/auth/guards/central-guest.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    canActivate: [centralGuestGuard],
    loadComponent: () =>
      import('./features/central/auth/pages/central-login/central-login.component').then(
        (m) => m.CentralLoginComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [centralAuthGuard],
    loadComponent: () =>
      import('./features/central/layout/central-layout.component').then(
        (m) => m.CentralLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tenants',
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/central/tenants/pages/tenant-list/tenant-list.component').then(
            (m) => m.TenantListComponent,
          ),
      },
      {
        path: 'tenants/new',
        loadComponent: () =>
          import('./features/central/tenants/pages/tenant-create/tenant-create.component').then(
            (m) => m.TenantCreateComponent,
          ),
      },
      {
        path: 'tenants/:uuid',
        loadComponent: () =>
          import('./features/central/tenants/pages/tenant-detail/tenant-detail.component').then(
            (m) => m.TenantDetailComponent,
          ),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin/tenants',
  },
  {
    path: '**',
    redirectTo: 'admin/tenants',
  },
];
