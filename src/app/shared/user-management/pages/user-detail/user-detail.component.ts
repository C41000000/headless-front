import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiErrorResponse, UpdateUserDto, UserDto } from '@core/models';
import { ToastService } from '@core/toast';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { USER_MANAGEMENT, findRole, roleLevel } from '../../user-management.config';
import { UsersService } from '../../users.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: '../user-form.scss',
})
export class UserDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly session = inject(AUTH_SESSION);
  protected readonly config = inject(USER_MANAGEMENT);
  private readonly toastService = inject(ToastService);

  protected readonly roles = this.config.roles;

  public readonly user = signal<UserDto | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly ownLevel = computed(() =>
    roleLevel(this.roles, this.session.currentUser()?.role),
  );
  public readonly isSelf = computed(
    () => !!this.user() && this.user()?.uuid === this.session.currentUser()?.uuid,
  );
  public readonly canUpdate = computed(() => this.user()?.abilities?.update ?? false);

  public readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: this.fb.nonNullable.control<string>(this.config.defaultRole, Validators.required),
  });

  public ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.router.navigate([this.config.basePath]);
      return;
    }
    this.loadUser(uuid);
  }

  public roleDescription(role: string): string {
    return findRole(this.roles, role)?.description ?? '';
  }

  public onSubmit(): void {
    const user = this.user();
    if (!user || this.isSaving() || !this.canUpdate()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // PATCH parcial: só os campos alterados
    const raw = this.form.getRawValue();
    const payload: UpdateUserDto = {};
    if (raw.name.trim() !== user.name) {
      payload.name = raw.name.trim();
    }
    if (raw.email.trim().toLowerCase() !== user.email) {
      payload.email = raw.email.trim().toLowerCase();
    }
    if (!this.isSelf() && raw.role !== user.role) {
      payload.role = raw.role;
    }

    if (Object.keys(payload).length === 0) {
      this.toastService.info('Nenhuma alteração para salvar.');
      return;
    }

    this.isSaving.set(true);
    this.validationErrors.set({});

    this.usersService.updateUser(user.uuid, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        if (this.isSelf()) {
          // Nome ou e-mail do menu do usuário mudaram
          this.session.refreshCurrentUser();
        }
        this.toastService.success(`Usuário "${payload.name ?? user.name}" atualizado com sucesso!`);
        this.router.navigate([this.config.basePath]);
      },
      error: (error: ApiErrorResponse) => {
        this.isSaving.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        this.toastService.error(error.message || 'Erro ao atualizar o usuário.');
      },
    });
  }

  private loadUser(uuid: string): void {
    this.isLoading.set(true);

    this.usersService.getUser(uuid).subscribe({
      next: (user) => {
        this.user.set(user);
        this.form.setValue({
          name: user.name,
          email: user.email,
          role: user.role ?? this.config.defaultRole,
        });
        if (!user.abilities?.update) {
          this.form.disable();
        } else if (this.isSelf()) {
          this.form.controls.role.disable();
        }
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(error.message || 'Erro ao carregar o usuário.');
        this.router.navigate([this.config.basePath]);
      },
    });
  }
}
