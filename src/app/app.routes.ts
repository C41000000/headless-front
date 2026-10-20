import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { TenantContextService } from '@core/tenant';
import { centralAuthGuard } from './features/central/auth/guards/central-auth.guard';
import { centralGuestGuard } from './features/central/auth/guards/central-guest.guard';
import { tenantAuthGuard } from './features/tenant/auth/guards/tenant-auth.guard';
import { tenantGuestGuard } from './features/tenant/auth/guards/tenant-guest.guard';

// O mesmo build atende o central e os tenants: a raiz depende do domínio acessado
const contextHome = () => (inject(TenantContextService).isTenant() ? 'painel' : 'admin/tenants');

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
    path: 'auth/login',
    canActivate: [tenantGuestGuard],
    loadComponent: () =>
      import('./features/tenant/auth/pages/tenant-login/tenant-login.component').then(
        (m) => m.TenantLoginComponent,
      ),
  },
  {
    path: 'painel',
    canActivate: [tenantAuthGuard],
    loadComponent: () =>
      import('./features/tenant/layout/tenant-layout.component').then(
        (m) => m.TenantLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/tenant/home/pages/tenant-home/tenant-home.component').then(
            (m) => m.TenantHomeComponent,
          ),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: contextHome,
  },
  {
    path: '**',
    redirectTo: contextHome,
  },
];
