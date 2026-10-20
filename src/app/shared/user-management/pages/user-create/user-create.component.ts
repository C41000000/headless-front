import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorResponse } from '@core/models';
import { ToastService } from '@core/toast';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { USER_MANAGEMENT, findRole, roleLevel } from '../../user-management.config';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-user-create',
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
    MatRadioModule,
  ],
  templateUrl: './user-create.component.html',
  styleUrl: '../user-form.scss',
})
export class UserCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly session = inject(AUTH_SESSION);
  protected readonly config = inject(USER_MANAGEMENT);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly roles = this.config.roles;

  public readonly isLoading = signal<boolean>(false);
  public readonly hidePassword = signal<boolean>(true);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  /** Só dá para atribuir papéis de nível igual ou menor que o seu (a API devolve 403 nos demais). */
  public readonly ownLevel = computed(() =>
    roleLevel(this.roles, this.session.currentUser()?.role),
  );

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: this.fb.nonNullable.control<string>(this.config.defaultRole, Validators.required),
  });

  public roleDescription(role: string): string {
    return findRole(this.roles, role)?.description ?? '';
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

    this.usersService
      .createUser({
        name: raw.name.trim(),
        email: raw.email.trim().toLowerCase(),
        password: raw.password,
        role: raw.role,
      })
      .subscribe({
        next: (user) => {
          this.isLoading.set(false);
          this.toastService.success(`Usuário "${user.name}" criado com sucesso!`);
          this.router.navigate([this.config.basePath]);
        },
        error: (error: ApiErrorResponse) => {
          this.isLoading.set(false);
          if (error.errors) {
            this.validationErrors.set(error.errors);
          }
          this.toastService.error(error.message || 'Falha ao criar usuário. Verifique os dados.');
        },
      });
  }
}
