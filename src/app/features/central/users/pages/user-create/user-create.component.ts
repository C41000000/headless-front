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
import { ApiErrorResponse, CentralRole } from '@core/models';
import { ToastService } from '@core/toast';
import { CentralAuthService } from '../../../auth/services/central-auth.service';
import { UsersService } from '../../services/users.service';
import { CENTRAL_ROLES, roleLevel } from '../../user-roles';

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
  private readonly authService = inject(CentralAuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly roles = CENTRAL_ROLES;

  public readonly isLoading = signal<boolean>(false);
  public readonly hidePassword = signal<boolean>(true);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  /** Só dá para atribuir papéis de nível igual ou menor que o seu (a API devolve 403 nos demais). */
  public readonly ownLevel = computed(() =>
    roleLevel(this.authService.currentUser()?.role ?? null),
  );

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: this.fb.nonNullable.control<CentralRole>('employee', Validators.required),
  });

  public roleDescription(role: CentralRole): string {
    return this.roles.find((option) => option.value === role)?.description ?? '';
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
          this.router.navigate(['/admin/users']);
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
