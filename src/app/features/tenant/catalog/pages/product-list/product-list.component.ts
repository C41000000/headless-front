import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, CategoryDto, ProductDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';

type StatusFilter = 'all' | 'active' | 'inactive';
type FeaturedFilter = 'all' | 'featured' | 'standard';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  public readonly displayedColumns: string[] = [
    'image',
    'name',
    'category',
    'price',
    'stock',
    'is_featured',
    'is_active',
    'actions',
  ];

  public readonly products = signal<ProductDto[]>([]);
  public readonly categories = signal<CategoryDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly busyUuid = signal<string | null>(null);

  // Filtros
  public readonly search = signal<string>('');
  public readonly categoryFilter = signal<string | null>(null);
  public readonly statusFilter = signal<StatusFilter>('all');
  public readonly featuredFilter = signal<FeaturedFilter>('all');

  // Paginação
  public readonly pageIndex = signal<number>(0);
  public readonly pageSize = signal<number>(15);
  public readonly totalItems = signal<number>(0);

  public readonly canCreate = computed(() => this.session.can('products.create'));
  public readonly canUpdate = computed(() => this.session.can('products.update'));
  public readonly canDelete = computed(() => this.session.can('products.delete'));

  public readonly hasFilters = computed(
    () =>
      !!this.search() ||
      this.categoryFilter() !== null ||
      this.statusFilter() !== 'all' ||
      this.featuredFilter() !== 'all',
  );

  public ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  public loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => undefined,
    });
  }

  public loadProducts(): void {
    this.isLoading.set(true);

    const isActive = this.statusFilter() === 'all' ? null : this.statusFilter() === 'active';
    const isFeatured =
      this.featuredFilter() === 'all' ? null : this.featuredFilter() === 'featured';

    this.productsService
      .getProducts({
        page: this.pageIndex() + 1,
        search: this.search().trim() || null,
        category_uuid: this.categoryFilter(),
        is_active: isActive,
        is_featured: isFeatured,
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalItems.set(response.meta.total);
          this.isLoading.set(false);
        },
        error: (error: ApiErrorResponse) => {
          this.toastService.error(error.message || 'Erro ao carregar os produtos.');
          this.isLoading.set(false);
        },
      });
  }

  public onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    this.loadProducts();
  }

  public onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadProducts();
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  public clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set(null);
    this.statusFilter.set('all');
    this.featuredFilter.set('all');
    this.pageIndex.set(0);
    this.loadProducts();
  }

  public onToggleActive(product: ProductDto, event: MatSlideToggleChange): void {
    event.source.checked = product.is_active;
    this.busyUuid.set(product.uuid);

    this.productsService.updateProduct(product.uuid, { is_active: !product.is_active }).subscribe({
      next: (updated) => {
        this.busyUuid.set(null);
        this.products.update((list) => list.map((p) => (p.uuid === updated.uuid ? updated : p)));
        this.toastService.success(
          updated.is_active ? 'Produto ativado na vitrine.' : 'Produto desativado.',
        );
      },
      error: (error: ApiErrorResponse) => {
        this.busyUuid.set(null);
        this.toastService.error(error.message || 'Erro ao alterar o status do produto.');
      },
    });
  }

  public onDelete(product: ProductDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Excluir Produto',
          message: `Deseja realmente excluir o produto "${product.name}"? Ele será removido da loja imediatamente.`,
          confirmText: 'Sim, excluir',
          cancelText: 'Cancelar',
          color: 'warn',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.busyUuid.set(product.uuid);

        this.productsService.deleteProduct(product.uuid).subscribe({
          next: () => {
            this.busyUuid.set(null);
            this.products.update((list) => list.filter((p) => p.uuid !== product.uuid));
            this.totalItems.update((t) => Math.max(0, t - 1));
            this.toastService.success('Produto excluído com sucesso.');
          },
          error: (error: ApiErrorResponse) => {
            this.busyUuid.set(null);
            this.toastService.error(error.message || 'Erro ao excluir o produto.');
          },
        });
      });
  }
}
