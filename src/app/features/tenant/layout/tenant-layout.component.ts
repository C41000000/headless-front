import { Component, OnInit, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { AppShellComponent, ShellNavItem } from '@shared/components/app-shell';
import { roleLabel } from '@shared/user-management';
import { TenantAuthService } from '../auth/services/tenant-auth.service';
import { TENANT_ROLES } from '../users/user-roles';

const NAV_ITEMS: readonly ShellNavItem[] = [
  { label: 'Início', icon: 'space_dashboard', route: '/painel', shortcut: 'I', exact: true },
  {
    label: 'Usuários',
    icon: 'group',
    route: '/painel/usuarios',
    shortcut: 'U',
    permission: 'users.view',
  },
  {
    label: 'Categorias',
    icon: 'category',
    route: '/painel/categorias',
    shortcut: 'C',
    permission: 'categories.view',
  },
  {
    label: 'Produtos',
    icon: 'inventory_2',
    route: '/painel/produtos',
    shortcut: 'P',
    permission: 'products.view',
  },
  {
    label: 'Banners',
    icon: 'view_carousel',
    route: '/painel/banners',
    shortcut: 'B',
    permission: 'banners.view',
  },
  {
    label: 'Identidade visual',
    icon: 'palette',
    route: '/painel/identidade-visual',
    shortcut: 'V',
    permission: 'visual-identity.view',
  },
];

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [RouterOutlet, NgTemplateOutlet, AppShellComponent],
  templateUrl: './tenant-layout.component.html',
  styleUrl: './tenant-layout.component.scss',
})
export class TenantLayoutComponent implements OnInit {
  private readonly authService = inject(TenantAuthService);
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly visualIdentityService = inject(VisualIdentityService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly roleLabel = computed(() =>
    roleLabel(TENANT_ROLES, this.authService.currentUser()?.role),
  );
  /** Nome curto do tenant: primeiro trecho do domínio (ex.: "alfa" em alfa.app.com). */
  protected readonly tenantName = computed(
    () => this.tenantContext.tenantDomain()?.split('.')[0] ?? 'painel',
  );
  protected readonly tenantInitial = computed(() => this.tenantName().charAt(0).toUpperCase());

  public ngOnInit(): void {
    // Atualiza papel e permissions; falhas (401) já são tratadas pelo interceptor
    this.authService.loadCurrentUser().subscribe({ error: () => undefined });
  }
}
