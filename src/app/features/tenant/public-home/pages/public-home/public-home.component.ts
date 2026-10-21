import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TokenService } from '@core/auth/token.service';
import { BannerDto, CategoryDto, ProductDto } from '@core/models';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { ThemeService } from '@core/theme';
import { BrandMarkComponent } from '@shared/components/brand-mark';
import { BannersService } from '../../../banners/services/banners.service';
import { CategoriesService } from '../../../catalog/services/categories.service';
import { ProductsService } from '../../../catalog/services/products.service';

const CAROUSEL_INTERVAL_MS = 6000;

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
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
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);

  // Banners
  public readonly banners = signal<BannerDto[]>([]);
  public readonly isLoadingBanners = signal<boolean>(true);
  public readonly currentSlide = signal<number>(0);
  public readonly isPaused = signal<boolean>(false);

  // Catálogo
  public readonly categories = signal<CategoryDto[]>([]);
  public readonly products = signal<ProductDto[]>([]);
  public readonly isLoadingCategories = signal<boolean>(false);
  public readonly isLoadingProducts = signal<boolean>(false);

  // Filtros
  public readonly selectedCategorySlug = signal<string | null>(null);
  public readonly searchQuery = signal<string>('');
  public readonly activeSearch = signal<string>('');
  public readonly onlyFeatured = signal<boolean>(false);

  // Paginação
  public readonly currentPage = signal<number>(1);
  public readonly totalProducts = signal<number>(0);
  public readonly lastPage = signal<number>(1);

  public readonly activeLogo = computed(() => {
    const vi = this.visualIdentityService.visualIdentity();
    if (!vi) return null;
    return this.themeService.isDark() ? vi.logo_dark_url || vi.logo_url : vi.logo_url;
  });

  public readonly selectedCategory = computed(() => {
    const slug = this.selectedCategorySlug();
    if (!slug) return null;
    return this.categories().find((c) => c.slug === slug) ?? null;
  });

  public readonly hasFilters = computed(
    () =>
      this.selectedCategorySlug() !== null ||
      this.activeSearch().trim().length > 0 ||
      this.onlyFeatured(),
  );

  public readonly currentYear = new Date().getFullYear();

  private timerId: ReturnType<typeof setInterval> | null = null;

  public ngOnInit(): void {
    this.loadBanners();
    this.loadCategories();
    this.loadProducts();
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

  public loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.categoriesService.getPublicCategories().subscribe({
      next: (data) => {
        this.categories.set(data ?? []);
        this.isLoadingCategories.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.isLoadingCategories.set(false);
      },
    });
  }

  public loadProducts(): void {
    this.isLoadingProducts.set(true);

    this.productsService
      .getPublicProducts({
        category_slug: this.selectedCategorySlug() ?? undefined,
        search: this.activeSearch().trim() || undefined,
        is_featured: this.onlyFeatured() ? true : undefined,
        page: this.currentPage(),
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.data ?? []);
          this.totalProducts.set(response.meta?.total ?? 0);
          this.lastPage.set(response.meta?.last_page ?? 1);
          this.isLoadingProducts.set(false);
        },
        error: () => {
          this.products.set([]);
          this.totalProducts.set(0);
          this.isLoadingProducts.set(false);
        },
      });
  }

  public selectCategory(slug: string | null): void {
    if (this.selectedCategorySlug() === slug) return;
    this.selectedCategorySlug.set(slug);
    this.currentPage.set(1);
    this.loadProducts();
  }

  public onSearchSubmit(): void {
    this.activeSearch.set(this.searchQuery().trim());
    this.currentPage.set(1);
    this.loadProducts();
  }

  public clearSearch(): void {
    this.searchQuery.set('');
    this.activeSearch.set('');
    this.currentPage.set(1);
    this.loadProducts();
  }

  public toggleOnlyFeatured(): void {
    this.onlyFeatured.update((v) => !v);
    this.currentPage.set(1);
    this.loadProducts();
  }

  public clearAllFilters(): void {
    this.selectedCategorySlug.set(null);
    this.searchQuery.set('');
    this.activeSearch.set('');
    this.onlyFeatured.set(false);
    this.currentPage.set(1);
    this.loadProducts();
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.lastPage() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadProducts();
  }

  public discountPercentage(product: ProductDto): number | null {
    if (!product.promotional_price || product.promotional_price >= product.price) {
      return null;
    }
    const discount = ((product.price - product.promotional_price) / product.price) * 100;
    return Math.round(discount);
  }

  // Carrossel de Banners
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
