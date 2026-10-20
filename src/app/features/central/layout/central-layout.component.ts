import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '@env/environment';
import { BrandMarkComponent } from '@shared/components/brand-mark';
import { AppShellComponent, ShellNavItem } from '@shared/components/app-shell';
import { roleLabel } from '@shared/user-management';
import { CentralAuthService } from '../auth/services/central-auth.service';
import { CENTRAL_ROLES } from '../users/user-roles';

const NAV_ITEMS: readonly ShellNavItem[] = [
  { label: 'Tenants', icon: 'domain', route: '/admin/tenants', shortcut: 'T' },
  {
    label: 'Usuários',
    icon: 'group',
    route: '/admin/usuarios',
    shortcut: 'U',
    permission: 'users.view',
  },
];

@Component({
  selector: 'app-central-layout',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent, BrandMarkComponent],
  templateUrl: './central-layout.component.html',
})
export class CentralLayoutComponent implements OnInit {
  private readonly authService = inject(CentralAuthService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly subtitle = `central · ${environment.production ? 'prod' : 'dev'}`;
  protected readonly roleLabel = computed(() =>
    roleLabel(CENTRAL_ROLES, this.authService.currentUser()?.role),
  );

  public ngOnInit(): void {
    // Atualiza papel e permissions; falhas (401) já são tratadas pelo interceptor
    this.authService.loadCurrentUser().subscribe({ error: () => undefined });
  }
}
