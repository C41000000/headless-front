import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const setup = (): ThemeService => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-dark');
  });

  it('should default to dark', () => {
    const service = setup();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('should toggle and persist the theme', () => {
    const service = setup();

    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('headless_theme')).toBe('light');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('should restore the stored theme', () => {
    localStorage.setItem('headless_theme', 'light');

    expect(setup().theme()).toBe('light');
  });
});
