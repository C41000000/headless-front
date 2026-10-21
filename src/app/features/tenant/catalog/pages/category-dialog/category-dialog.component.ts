import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiErrorResponse, CategoryDto, CreateCategoryDto } from '@core/models';
import { ToastService } from '@core/toast';
import { CategoriesService } from '../../services/categories.service';

export interface CategoryDialogData {
  category?: CategoryDto;
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      {{ isEdit ? 'Editar Categoria' : 'Nova Categoria' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" id="categoryForm" class="dialog-form">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Nome da categoria</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex.: Roupas, Eletrônicos..."
            required
            maxlength="255"
          />
          @if (form.controls.name.hasError('required')) {
            <mat-error>O nome da categoria é obrigatório.</mat-error>
          }
          @if (validationErrors()['name']) {
            <mat-error>{{ validationErrors()['name'][0] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Slug (identificador amigável)</mat-label>
          <input
            matInput
            formControlName="slug"
            placeholder="Gerado automaticamente se vazio"
            maxlength="255"
          />
          @if (validationErrors()['slug']) {
            <mat-error>{{ validationErrors()['slug'][0] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Descrição</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Breve descrição da categoria..."
            maxlength="2000"
          ></textarea>
          @if (validationErrors()['description']) {
            <mat-error>{{ validationErrors()['description'][0] }}</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="order-field">
            <mat-label>Ordem de exibição</mat-label>
            <input matInput type="number" formControlName="order" min="0" />
          </mat-form-field>

          <div class="toggle-container">
            <mat-slide-toggle class="app-switch" hideIcon formControlName="is_active">
              Categoria ativa
            </mat-slide-toggle>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSaving()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        type="submit"
        form="categoryForm"
        [disabled]="isSaving()"
      >
        @if (isSaving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          Salvar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--app-text-strong);
      margin: 0;
      padding-bottom: 0.5rem;
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.5rem;
      min-width: 320px;
    }

    .form-field {
      width: 100%;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .order-field {
      width: 140px;
    }

    .toggle-container {
      display: flex;
      align-items: center;
      padding-bottom: 1.25rem;
    }
  `,
})
export class CategoryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private readonly toastService = inject(ToastService);
  protected readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA, { optional: true });

  public readonly isSaving = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly isEdit = !!this.data?.category;

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.maxLength(255)]],
    description: [''],
    order: [0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  public ngOnInit(): void {
    if (this.data?.category) {
      const cat = this.data.category;
      this.form.patchValue({
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? '',
        order: cat.order,
        is_active: cat.is_active,
      });
    }
  }

  public onSubmit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const payload: CreateCategoryDto = {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      description: raw.description.trim() || null,
      order: Number(raw.order),
      is_active: raw.is_active,
    };

    const request$ =
      this.isEdit && this.data?.category
        ? this.categoriesService.updateCategory(this.data.category.uuid, payload)
        : this.categoriesService.createCategory(payload);

    request$.subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.toastService.success(
          this.isEdit ? 'Categoria atualizada!' : 'Categoria criada com sucesso!',
        );
        this.dialogRef.close(saved);
      },
      error: (error: ApiErrorResponse) => {
        this.isSaving.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        this.toastService.error(error.message || 'Erro ao salvar categoria.');
      },
    });
  }
}
