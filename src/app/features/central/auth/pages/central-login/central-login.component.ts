import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ApiErrorResponse } from '@core/models';
import { ToastService } from '@core/toast';
import { CentralAuthService } from '../../services/central-auth.service';

@Component({
  selector: 'app-central-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './central-login.component.html',
  styleUrl: './central-login.component.scss',
})
export class CentralLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CentralAuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  public readonly isLoading = signal<boolean>(false);
  public readonly hidePassword = signal<boolean>(true);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.validationErrors.set({});

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('Autenticado com sucesso no Painel Central!');
        this.router.navigate(['/admin/tenants']);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);

        if (error.errors) {
          this.validationErrors.set(error.errors);
        }

        let msg = error.message || 'Falha ao autenticar. Verifique suas credenciais.';
        if (error.status === 429 && error.retryAfter) {
          msg = `Muitas tentativas de login. Aguarde ${error.retryAfter} segundos antes de tentar novamente.`;
        }
        this.toastService.error(msg);
      },
    });
  }
}
