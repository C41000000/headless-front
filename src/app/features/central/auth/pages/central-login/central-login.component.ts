import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiErrorResponse } from '@core/models';
import { CentralAuthService } from '../../services/central-auth.service';

@Component({
  selector: 'app-central-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './central-login.component.html',
  styleUrl: './central-login.component.scss',
})
export class CentralLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CentralAuthService);
  private readonly router = inject(Router);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/tenants']);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);

        if (error.errors) {
          this.validationErrors.set(error.errors);
        }

        if (error.status === 429 && error.retryAfter) {
          this.errorMessage.set(
            `Muitas tentativas de login. Aguarde ${error.retryAfter} segundos antes de tentar novamente.`,
          );
        } else {
          this.errorMessage.set(error.message || 'Falha ao autenticar. Verifique suas credenciais.');
        }
      },
    });
  }
}
