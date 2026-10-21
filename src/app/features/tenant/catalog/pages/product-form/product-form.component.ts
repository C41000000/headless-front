import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, CategoryDto, CreateProductDto, ProductDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';

const URL_PATTERN = /^https?:\/\/\S+$/i;

function priceValidator(group: AbstractControl): ValidationErrors | null {
  const price = group.get('price')?.value;
  const promoControl = group.get('promotional_price');
  const promo = promoControl?.value;

  const hasPromo = promo !== null && promo !== undefined && promo !== '';
  const hasPrice = price !== null && price !== undefined && price !== '';

  if (hasPromo && hasPrice && Number(promo) >= Number(price)) {
    promoControl?.setErrors({ ...(promoControl.errors || {}), promoGtePrice: true });
    return { promoGtePrice: true };
  }

  if (promoControl?.hasError('promoGtePrice')) {
    const errors = { ...promoControl.errors };
    delete errors['promoGtePrice'];
    promoControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  return null;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  public readonly product = signal<ProductDto | null>(null);
  public readonly categories = signal<CategoryDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);
  public readonly isDeleting = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});
  public readonly previewBroken = signal<boolean>(false);

  private readonly uuid = this.route.snapshot.paramMap.get('uuid');
  public readonly isEdit = this.uuid !== null;

  public readonly canSave = computed(() =>
    this.session.can(this.isEdit ? 'products.update' : 'products.create'),
  );
  public readonly canDelete = computed(() => this.isEdit && this.session.can('products.delete'));

  public readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      slug: ['', [Validators.maxLength(255)]],
      category_uuid: this.fb.control<string | null>(null),
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      promotional_price: this.fb.control<number | null>(null, [Validators.min(0)]),
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: ['', [Validators.maxLength(100)]],
      image_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
      is_active: [true],
      is_featured: [false],
    },
    { validators: priceValidator },
  );

  public ngOnInit(): void {
    this.loadCategories();
    if (this.uuid) {
      this.loadProduct(this.uuid);
    }
    if (!this.canSave()) {
      this.form.disable();
    }
  }

  public loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => undefined,
    });
  }

  public onPreviewError(): void {
    this.previewBroken.set(true);
  }

  public onImageUrlInput(): void {
    this.previewBroken.set(false);
  }

  public onSubmit(): void {
    if (this.isSaving() || !this.canSave()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (
        this.form.hasError('promoGtePrice') ||
        this.form.controls.promotional_price.hasError('promoGtePrice')
      ) {
        this.toastService.warning('O preço promocional deve ser menor que o preço original.');
      } else {
        this.toastService.warning('Verifique os campos obrigatórios do formulário.');
      }
      return;
    }

    this.isSaving.set(true);
    this.validationErrors.set({});

    const payload = this.buildPayload();
    const product = this.product();

    const request$ = product
      ? this.productsService.updateProduct(product.uuid, payload)
      : this.productsService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success(
          product ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        );
        this.router.navigate(['/painel/produtos']);
      },
      error: (error: ApiErrorResponse) => {
        this.isSaving.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        this.toastService.error(error.message || 'Erro ao salvar o produto.');
      },
    });
  }

  public onDelete(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Excluir Produto',
          message: `Deseja realmente excluir o produto "${product.name}"?`,
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

        this.isDeleting.set(true);
        this.productsService.deleteProduct(product.uuid).subscribe({
          next: () => {
            this.toastService.success('Produto excluído.');
            this.router.navigate(['/painel/produtos']);
          },
          error: (error: ApiErrorResponse) => {
            this.isDeleting.set(false);
            this.toastService.error(error.message || 'Erro ao excluir o produto.');
          },
        });
      });
  }

  private buildPayload(): CreateProductDto {
    const raw = this.form.getRawValue();
    const orNull = (value: string | null | undefined): string | null =>
      value && value.trim() ? value.trim() : null;

    return {
      name: raw.name.trim(),
      slug: orNull(raw.slug) ?? undefined,
      category_uuid: raw.category_uuid || null,
      description: orNull(raw.description),
      price: Number(raw.price),
      promotional_price:
        raw.promotional_price !== null &&
        raw.promotional_price !== undefined &&
        raw.promotional_price !== ('' as unknown)
          ? Number(raw.promotional_price)
          : null,
      stock: Number(raw.stock),
      sku: orNull(raw.sku),
      image_url: orNull(raw.image_url),
      is_active: raw.is_active,
      is_featured: raw.is_featured,
    };
  }

  private loadProduct(uuid: string): void {
    this.isLoading.set(true);

    this.productsService.getProduct(uuid).subscribe({
      next: (product) => {
        this.product.set(product);
        this.form.patchValue({
          name: product.name,
          slug: product.slug,
          category_uuid: product.category_uuid ?? null,
          description: product.description ?? '',
          price: product.price,
          promotional_price: product.promotional_price,
          stock: product.stock,
          sku: product.sku ?? '',
          image_url: product.image_url ?? '',
          is_active: product.is_active,
          is_featured: product.is_featured,
        });
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(error.message || 'Erro ao carregar o produto.');
        this.router.navigate(['/painel/produtos']);
      },
    });
  }
}
