import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { BannerDto } from '@core/models';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { ThemeService } from '@core/theme';
import { BrandMarkComponent } from '@shared/components/brand-mark';
import { BannersService } from '../../../banners/services/banners.service';

const CAROUSEL_INTERVAL_MS = 6000;

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BrandMarkComponent,
  ],
  templateUrl: './public-home.component.html',
  styleUrl: './public-home.component.scss',
})
export class PublicHomeComponent implements OnInit, OnDestroy {
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly visualIdentityService = inject(VisualIdentityService);
  protected readonly tokenService = inject(TokenService);
  protected readonly themeService = inject(ThemeService);
  private readonly bannersService = inject(BannersService);

  public readonly banners = signal<BannerDto[]>([]);
  public readonly isLoadingBanners = signal<boolean>(true);
  public readonly currentSlide = signal<number>(0);
  public readonly isPaused = signal<boolean>(false);

  public readonly activeLogo = computed(() => {
    const vi = this.visualIdentityService.visualIdentity();
    if (!vi) return null;
    return this.themeService.isDark() ? vi.logo_dark_url || vi.logo_url : vi.logo_url;
  });

  public readonly currentYear = new Date().getFullYear();

  private timerId: ReturnType<typeof setInterval> | null = null;

  public ngOnInit(): void {
    this.loadBanners();
  }

  public ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  public loadBanners(): void {
    this.isLoadingBanners.set(true);

    this.bannersService.getPublicBanners('home').subscribe({
      next: (data) => {
        this.banners.set(data ?? []);
        this.isLoadingBanners.set(false);
        if (data && data.length > 1) {
          this.startAutoPlay();
        }
      },
      error: () => {
        this.banners.set([]);
        this.isLoadingBanners.set(false);
      },
    });
  }

  public nextSlide(): void {
    const total = this.banners().length;
    if (total <= 1) return;
    this.currentSlide.update((idx) => (idx + 1) % total);
  }

  public prevSlide(): void {
    const total = this.banners().length;
    if (total <= 1) return;
    this.currentSlide.update((idx) => (idx - 1 + total) % total);
  }

  public goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  public onMouseEnter(): void {
    this.isPaused.set(true);
  }

  public onMouseLeave(): void {
    this.isPaused.set(false);
  }

  private startAutoPlay(): void {
    if (typeof window === 'undefined') return;
    this.stopAutoPlay();
    this.timerId = setInterval(() => {
      if (!this.isPaused() && this.banners().length > 1) {
        this.nextSlide();
      }
    }, CAROUSEL_INTERVAL_MS);
  }

  private stopAutoPlay(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
