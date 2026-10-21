import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, CategoryDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { CategoriesService } from '../../services/categories.service';
import { CategoryDialogComponent } from '../category-dialog/category-dialog.component';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  public readonly displayedColumns: string[] = [
    'name',
    'slug',
    'products_count',
    'order',
    'is_active',
    'actions',
  ];

  public readonly categories = signal<CategoryDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly busyUuid = signal<string | null>(null);

  public readonly search = signal<string>('');
  public readonly statusFilter = signal<StatusFilter>('all');

  public readonly canCreate = computed(() => this.session.can('categories.create'));
  public readonly canUpdate = computed(() => this.session.can('categories.update'));
  public readonly canDelete = computed(() => this.session.can('categories.delete'));

  public readonly filteredCategories = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.categories().filter((cat) => {
      const matchSearch =
        !term ||
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term) ||
        (cat.description ?? '').toLowerCase().includes(term);

      const matchStatus =
        status === 'all' ||
        (status === 'active' && cat.is_active) ||
        (status === 'inactive' && !cat.is_active);

      return matchSearch && matchStatus;
    });
  });

  public readonly activeCount = computed(
    () => this.categories().filter((cat) => cat.is_active).length,
  );
  public readonly hasFilters = computed(() => !!this.search() || this.statusFilter() !== 'all');

  public ngOnInit(): void {
    this.loadCategories();
  }

  public onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  public clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
  }

  public loadCategories(): void {
    this.isLoading.set(true);

    this.categoriesService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.toastService.error(error.message || 'Erro ao carregar as categorias.');
        this.isLoading.set(false);
      },
    });
  }

  public openCreateDialog(): void {
    this.dialog
      .open(CategoryDialogComponent, {
        width: '480px',
      })
      .afterClosed()
      .subscribe((created: CategoryDto | undefined) => {
        if (created) {
          this.loadCategories();
        }
      });
  }

  public openEditDialog(category: CategoryDto): void {
    this.dialog
      .open(CategoryDialogComponent, {
        width: '480px',
        data: { category },
      })
      .afterClosed()
      .subscribe((updated: CategoryDto | undefined) => {
        if (updated) {
          this.categories.update((list) =>
            list.map((c) => (c.uuid === updated.uuid ? updated : c)),
          );
        }
      });
  }

  public onToggleActive(category: CategoryDto, event: MatSlideToggleChange): void {
    event.source.checked = category.is_active;
    this.busyUuid.set(category.uuid);

    this.categoriesService
      .updateCategory(category.uuid, { is_active: !category.is_active })
      .subscribe({
        next: (updated) => {
          this.busyUuid.set(null);
          this.categories.update((list) =>
            list.map((c) => (c.uuid === updated.uuid ? updated : c)),
          );
          this.toastService.success(
            updated.is_active ? 'Categoria ativada.' : 'Categoria desativada.',
          );
        },
        error: (error: ApiErrorResponse) => {
          this.busyUuid.set(null);
          this.toastService.error(error.message || 'Erro ao alterar a categoria.');
        },
      });
  }

  public onDelete(category: CategoryDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Excluir Categoria',
          message: `Deseja realmente excluir a categoria "${category.name}"? Os produtos vinculados ficarão sem categoria.`,
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

        this.busyUuid.set(category.uuid);

        this.categoriesService.deleteCategory(category.uuid).subscribe({
          next: () => {
            this.busyUuid.set(null);
            this.categories.update((list) => list.filter((c) => c.uuid !== category.uuid));
            this.toastService.success('Categoria excluída com sucesso.');
          },
          error: (error: ApiErrorResponse) => {
            this.busyUuid.set(null);
            this.toastService.error(error.message || 'Erro ao excluir a categoria.');
          },
        });
      });
  }
}
