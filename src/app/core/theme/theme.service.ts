import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'headless_theme';
const DARK_CLASS = 'theme-dark';

/**
 * Tema claro/escuro dos painéis (escuro por padrão), salvo no localStorage. No
 * tenant, as cores de marca vêm da identidade visual em qualquer um dos temas.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _theme = signal<ThemeMode>(this.readStoredTheme() ?? 'dark');
  public readonly theme = this._theme.asReadonly();
  public readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle(DARK_CLASS, this.isDark());
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
