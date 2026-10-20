import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/theme';
import { environment } from '@env/environment';
import { BrandMarkComponent } from '@shared/components/brand-mark';
import { filter } from 'rxjs';
import { CentralAuthService } from '../auth/services/central-auth.service';
import { roleLabel } from '../users/user-roles';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Segunda tecla do atalho "G + tecla". */
  shortcut: string;
  permission?: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Tenants', icon: 'domain', route: '/admin/tenants', shortcut: 'T' },
  {
    label: 'Usuários',
    icon: 'group',
    route: '/admin/users',
    shortcut: 'U',
    permission: 'users.view',
  },
];

/** Tempo para a segunda tecla do atalho "G + tecla". */
const SHORTCUT_WINDOW_MS = 1000;

@Component({
  selector: 'app-central-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    BrandMarkComponent,
  ],
  templateUrl: './central-layout.component.html',
  styleUrl: './central-layout.component.scss',
})
export class CentralLayoutComponent implements OnInit {
  protected readonly authService = inject(CentralAuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly roleLabel = roleLabel;
  protected readonly envLabel = environment.production ? 'prod' : 'dev';

  /** Menu lateral aberto em telas estreitas (em telas largas ele fica sempre visível). */
  public readonly isNavOpen = signal<boolean>(false);
  public readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.permission || this.authService.can(item.permission)),
  );
  public readonly userInitial = computed(
    () => this.authService.currentUser()?.name.trim().charAt(0).toUpperCase() ?? '?',
  );

  private awaitingShortcutSince: number | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.isNavOpen.set(false));
  }

  public ngOnInit(): void {
    // Atualiza papel e permissions; falhas (401) já são tratadas pelo interceptor
    this.authService.loadCurrentUser().subscribe({ error: () => undefined });
  }

  public onLogout(): void {
    this.authService.logout();
  }

  /** Atalhos "G T" (tenants) e "G U" (usuários), ignorados enquanto se digita. */
  @HostListener('document:keydown', ['$event'])
  public onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || this.isTyping(event.target)) {
      return;
    }

    const key = event.key.toUpperCase();
    const now = Date.now();

    if (
      this.awaitingShortcutSince !== null &&
      now - this.awaitingShortcutSince < SHORTCUT_WINDOW_MS
    ) {
      this.awaitingShortcutSince = null;
      const item = this.navItems().find((navItem) => navItem.shortcut === key);
      if (item) {
        event.preventDefault();
        this.router.navigateByUrl(item.route);
      }
      return;
    }

    this.awaitingShortcutSince = key === 'G' ? now : null;
  }

  private isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
  }
}
