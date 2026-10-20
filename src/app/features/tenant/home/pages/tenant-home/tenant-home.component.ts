import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { TenantContextService } from '@core/tenant';
import { UsersService } from '@shared/user-management';
import { bannerStatus } from '../../../banners/banner-status';
import { BannersService } from '../../../banners/services/banners.service';

interface Shortcut {
  label: string;
  description: string;
  icon: string;
  route: string;
  permission: string;
}

const SHORTCUTS: readonly Shortcut[] = [
  {
    label: 'Banners',
    description: 'Crie, agende e ordene os banners do site.',
    icon: 'view_carousel',
    route: '/painel/banners',
    permission: 'banners.view',
  },
  {
    label: 'Identidade visual',
    description: 'Cores, logos e fonte da sua marca.',
    icon: 'palette',
    route: '/painel/identidade-visual',
    permission: 'visual-identity.view',
  },
  {
    label: 'Usuários',
    description: 'Quem acessa o painel e com qual papel.',
    icon: 'group',
    route: '/painel/usuarios',
    permission: 'users.view',
  },
];

@Component({
  selector: 'app-tenant-home',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './tenant-home.component.html',
  styleUrl: './tenant-home.component.scss',
})
export class TenantHomeComponent implements OnInit {
  private readonly session = inject(AUTH_SESSION);
  private readonly usersService = inject(UsersService);
  private readonly bannersService = inject(BannersService);
  protected readonly tenantContext = inject(TenantContextService);

  public readonly usersTotal = signal<number | null>(null);
  public readonly bannersTotal = signal<number | null>(null);
  public readonly bannersLive = signal<number | null>(null);

  public readonly firstName = computed(
    () => this.session.currentUser()?.name.trim().split(/\s+/)[0] ?? '',
  );
  public readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'bom dia' : hour < 18 ? 'boa tarde' : 'boa noite';
  });
  public readonly shortcuts = computed(() =>
    SHORTCUTS.filter((shortcut) => this.session.can(shortcut.permission)),
  );
  public readonly canSeeUsers = computed(() => this.session.can('users.view'));
  public readonly canSeeBanners = computed(() => this.session.can('banners.view'));

  public ngOnInit(): void {
    // As métricas dependem das permissions, que podem chegar depois (via /auth/me)
    this.session.loadCurrentUser().subscribe({
      next: () => this.loadMetrics(),
      error: () => undefined,
    });
  }

  private loadMetrics(): void {
    if (this.canSeeUsers()) {
      this.usersService.getUsers(1).subscribe({
        next: (response) => this.usersTotal.set(response.meta.total),
        error: () => undefined,
      });
    }
    if (this.canSeeBanners()) {
      this.bannersService.getBanners().subscribe({
        next: (banners) => {
          this.bannersTotal.set(banners.length);
          this.bannersLive.set(banners.filter((b) => bannerStatus(b) === 'live').length);
        },
        error: () => undefined,
      });
    }
  }
}
