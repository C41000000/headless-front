import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { permissionGuard } from '@core/auth/permission.guard';
import { TenantContextService } from '@core/tenant';
import { USER_MANAGEMENT, UserManagementConfig } from '@shared/user-management';
import { CentralAuthService } from './features/central/auth/services/central-auth.service';
import { CENTRAL_ROLES } from './features/central/users/user-roles';
import { TenantAuthService } from './features/tenant/auth/services/tenant-auth.service';
import { TENANT_ROLES } from './features/tenant/users/user-roles';
import { centralAuthGuard } from './features/central/auth/guards/central-auth.guard';
import { centralGuestGuard } from './features/central/auth/guards/central-guest.guard';
import { tenantAuthGuard } from './features/tenant/auth/guards/tenant-auth.guard';
import { tenantGuestGuard } from './features/tenant/auth/guards/tenant-guest.guard';

// O mesmo build atende o central e os tenants: a raiz depende do domínio acessado
const contextHome = () => (inject(TenantContextService).isTenant() ? '' : 'admin/tenants');

/** Rotas de usuários (lista, criação e edição), iguais no central e no tenant. */
function userRoutes(config: UserManagementConfig, fallbackUrl: string): Routes {
  return [
    {
      path: 'usuarios',
      providers: [{ provide: USER_MANAGEMENT, useValue: config }],
      children: [
        {
          path: '',
          canActivate: [permissionGuard('users.view', fallbackUrl)],
          loadComponent: () =>
            import('@shared/user-management/pages/user-list/user-list.component').then(
              (m) => m.UserListComponent,
            ),
        },
        {
          path: 'novo',
          canActivate: [permissionGuard('users.create', fallbackUrl)],
          loadComponent: () =>
            import('@shared/user-management/pages/user-create/user-create.component').then(
              (m) => m.UserCreateComponent,
            ),
        },
        {
          path: ':uuid',
          canActivate: [permissionGuard('users.view', fallbackUrl)],
          loadComponent: () =>
            import('@shared/user-management/pages/user-detail/user-detail.component').then(
              (m) => m.UserDetailComponent,
            ),
        },
      ],
    },
  ];
}

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
    providers: [{ provide: AUTH_SESSION, useExisting: CentralAuthService }],
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
        path: 'tenants/novo',
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
      ...userRoutes(
        {
          basePath: '/admin/usuarios',
          subtitle: 'Equipe com acesso ao painel central e seus papéis',
          roles: CENTRAL_ROLES,
          defaultRole: 'employee',
        },
        '/admin/tenants',
      ),
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
    providers: [{ provide: AUTH_SESSION, useExisting: TenantAuthService }],
    loadComponent: () =>
      import('./features/tenant/layout/tenant-layout.component').then(
        (m) => m.TenantLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/tenant/home/pages/tenant-home/tenant-home.component').then(
            (m) => m.TenantHomeComponent,
          ),
      },
      ...userRoutes(
        {
          basePath: '/painel/usuarios',
          subtitle: 'Equipe com acesso ao painel e seus papéis',
          roles: TENANT_ROLES,
          defaultRole: 'employee',
        },
        '/painel',
      ),
      {
        path: 'categorias',
        canActivate: [permissionGuard('categories.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/catalog/pages/category-list/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
      },
      {
        path: 'produtos',
        canActivate: [permissionGuard('products.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/catalog/pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'produtos/novo',
        canActivate: [permissionGuard('products.create', '/painel')],
        loadComponent: () =>
          import('./features/tenant/catalog/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'produtos/:uuid/editar',
        canActivate: [permissionGuard('products.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/catalog/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'banners',
        canActivate: [permissionGuard('banners.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/banners/pages/banner-list/banner-list.component').then(
            (m) => m.BannerListComponent,
          ),
      },
      {
        path: 'banners/novo',
        canActivate: [permissionGuard('banners.create', '/painel')],
        loadComponent: () =>
          import('./features/tenant/banners/pages/banner-form/banner-form.component').then(
            (m) => m.BannerFormComponent,
          ),
      },
      {
        path: 'banners/:uuid',
        canActivate: [permissionGuard('banners.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/banners/pages/banner-form/banner-form.component').then(
            (m) => m.BannerFormComponent,
          ),
      },
      {
        path: 'identidade-visual',
        canActivate: [permissionGuard('visual-identity.view', '/painel')],
        loadComponent: () =>
          import('./features/tenant/visual-identity/pages/visual-identity/visual-identity.component').then(
            (m) => m.VisualIdentityComponent,
          ),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    canMatch: [() => inject(TenantContextService).isTenant()],
    loadComponent: () =>
      import('./features/tenant/public-home/pages/public-home/public-home.component').then(
        (m) => m.PublicHomeComponent,
      ),
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
