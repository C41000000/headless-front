import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TenantContextService } from '@core/tenant';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'headless_theme';
const DARK_CLASS = 'theme-dark';

/**
 * Tema claro/escuro do painel central (escuro por padrão), salvo no localStorage.
 * No contexto tenant fica sempre claro: o site do tenant usa a identidade visual dele.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly tenantContext = inject(TenantContextService);

  private readonly _theme = signal<ThemeMode>(this.readStoredTheme() ?? 'dark');
  public readonly theme = this._theme.asReadonly();
  public readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const dark = this.isDark() && this.tenantContext.isCentral();
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle(DARK_CLASS, dark);
      }
    });
  }

  public toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  public setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  }

  private readStoredTheme(): ThemeMode | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }
}
