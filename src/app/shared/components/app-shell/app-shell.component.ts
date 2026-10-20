import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ThemeService } from '@core/theme';
import { filter } from 'rxjs';

export interface ShellNavItem {
  label: string;
  icon: string;
  route: string;
  /** Segunda tecla do atalho "G + tecla". */
  shortcut: string;
  /** Só aparece para quem tem a permission. */
  permission?: string;
  /** Ativo só na rota exata (ex.: a página inicial). */
  exact?: boolean;
}

/** Tempo para a segunda tecla do atalho "G + tecla". */
const SHORTCUT_WINDOW_MS = 1000;

/**
 * Estrutura dos painéis (central e tenant): navegação lateral com marca, itens,
 * tema e usuário logado, e o conteúdo da página ao lado. A marca entra pelo slot
 * `[shellBrand]`; o usuário vem da sessão do contexto (AUTH_SESSION).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly session = inject(AUTH_SESSION);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  public readonly homeRoute = input.required<string>();
  public readonly subtitle = input<string>('');
  public readonly navItems = input.required<readonly ShellNavItem[]>();
  /** Rótulo do papel do usuário logado (ex.: "Admin"). */
  public readonly roleLabel = input<string>('');

  /** Menu lateral aberto em telas estreitas (em telas largas ele fica sempre visível). */
  public readonly isNavOpen = signal<boolean>(false);
  public readonly visibleItems = computed(() =>
    this.navItems().filter((item) => !item.permission || this.session.can(item.permission)),
  );
  public readonly userInitial = computed(
    () => this.session.currentUser()?.name.trim().charAt(0).toUpperCase() ?? '?',
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

  public onLogout(): void {
    this.session.logout();
  }

  /** Atalhos "G + tecla" dos itens de navegação, ignorados enquanto se digita. */
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
      const item = this.visibleItems().find((navItem) => navItem.shortcut === key);
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
