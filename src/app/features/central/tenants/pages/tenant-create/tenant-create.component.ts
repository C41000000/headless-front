import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorResponse } from '@core/models';
import { ToastService } from '@core/toast';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenant-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tenant-create.component.html',
  styleUrl: './tenant-create.component.scss',
})
export class TenantCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly tenantsService = inject(TenantsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  public readonly isLoading = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    domains: this.fb.array([this.createDomainControl()], [Validators.required]),
  });

  public get domainsArray(): FormArray<FormControl<string>> {
    return this.form.get('domains') as FormArray<FormControl<string>>;
  }

  public createDomainControl(): FormControl<string> {
    return this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-z0-9.-]+$/i)],
    });
  }

  public addDomainField(): void {
    this.domainsArray.push(this.createDomainControl());
  }

  public removeDomainField(index: number): void {
    if (this.domainsArray.length > 1) {
      this.domainsArray.removeAt(index);
    }
  }

  public onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name ?? '',
      domains: (raw.domains ?? []).map((d) => d.trim().toLowerCase()),
    };

    this.tenantsService.createTenant(payload).subscribe({
      next: (tenant) => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/tenants'], {
          queryParams: { created: tenant.name },
        });
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        const msg = error.message || 'Falha ao criar tenant. Verifique os dados informados.';
        this.toastService.error(msg);
      },
    });
  }
}
