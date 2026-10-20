import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ApiErrorResponse, PaginationMeta, UserDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { MatPaginatorIntlPtBr } from '@shared/paginator/mat-paginator-intl-ptbr';
import { Subscription, debounceTime, distinctUntilChanged, map, skip } from 'rxjs';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { USER_MANAGEMENT, roleLabel } from '../../user-management.config';
import { UsersService } from '../../users.service';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr }],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly session = inject(AUTH_SESSION);
  protected readonly config = inject(USER_MANAGEMENT);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription: Subscription | null = null;

  protected readonly roles = this.config.roles;

  public readonly displayedColumns: string[] = ['name', 'role', 'status', 'created_at', 'actions'];
  public readonly users = signal<UserDto[]>([]);
  public readonly meta = signal<PaginationMeta | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly busyUuid = signal<string | null>(null);

  /** Texto digitado no campo de busca. */
  public readonly searchTerm = signal<string>('');
  /** Termo efetivamente aplicado na última consulta à API (após o debounce). */
  public readonly searchQuery = signal<string>('');
  public readonly roleFilter = signal<string | null>(null);
  public readonly statusFilter = signal<StatusFilter>('all');

  public readonly currentUserUuid = computed(() => this.session.currentUser()?.uuid ?? null);
  public readonly canCreate = computed(() => this.session.can('users.create'));
  public readonly hasFilters = computed(
    () => !!this.searchQuery() || this.roleFilter() !== null || this.statusFilter() !== 'all',
  );

  constructor() {
    // A busca é feita no servidor, então espera o usuário parar de digitar antes de consultar.
    toObservable(this.searchTerm)
      .pipe(
        skip(1),
        debounceTime(300),
        map((term) => term.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.searchQuery.set(term);
        this.loadUsers(1);
      });
  }

  public ngOnInit(): void {
    this.loadUsers(1);
  }

  public onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  public onRoleFilterChange(role: string | null): void {
    this.roleFilter.set(role);
    this.loadUsers(1);
  }

  public onStatusFilterChange(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.loadUsers(1);
  }

  public clearFilters(): void {
    this.searchTerm.set('');
    this.searchQuery.set('');
    this.roleFilter.set(null);
    this.statusFilter.set('all');
    this.loadUsers(1);
  }

  public labelFor(role: string | null): string {
    return roleLabel(this.roles, role);
  }

  public hasAnyAbility(user: UserDto): boolean {
    const abilities = user.abilities;
    return !!abilities && (abilities.update || abilities.delete);
  }

  public loadUsers(page = 1): void {
    this.isLoading.set(true);

    const status = this.statusFilter();

    // Descarta a resposta anterior para um filtro antigo não sobrescrever o mais recente.
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.usersService
      .getUsers(page, {
        search: this.searchQuery(),
        role: this.roleFilter(),
        is_active: status === 'all' ? null : status === 'active',
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.meta.set(response.meta);
          this.isLoading.set(false);
        },
        error: (error: ApiErrorResponse) => {
          this.toastService.error(error.message || 'Erro ao carregar a lista de usuários.');
          this.isLoading.set(false);
        },
      });
  }

  public onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex + 1);
  }

  public onToggleStatus(user: UserDto, event: MatSlideToggleChange): void {
    // O toggle só muda de verdade quando a API confirmar (ou o usuário cancelar o diálogo)
    event.source.checked = user.is_active;

    if (!user.is_active) {
      this.toggleStatus(user);
      return;
    }

    // Desativar tira o acesso da pessoa, então pede confirmação; reativar não
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Desativar Usuário',
          message: `"${user.name}" não conseguirá mais entrar no painel até ser reativado.`,
          confirmText: 'Desativar',
          cancelText: 'Cancelar',
          color: 'warn',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.toggleStatus(user);
        }
      });
  }

  public onDelete(user: UserDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Excluir Usuário',
          message: `Deseja realmente excluir "${user.name}"? Ele perderá o acesso ao painel.`,
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

        this.busyUuid.set(user.uuid);

        this.usersService.deleteUser(user.uuid).subscribe({
          next: () => {
            this.busyUuid.set(null);
            this.toastService.success(`Usuário "${user.name}" excluído.`);
            const meta = this.meta();
            // Se era o último da página, volta uma página para não mostrar uma lista vazia
            const page =
              meta && meta.current_page > 1 && this.users().length === 1
                ? meta.current_page - 1
                : (meta?.current_page ?? 1);
            this.loadUsers(page);
          },
          error: (error: ApiErrorResponse) => {
            this.busyUuid.set(null);
            this.toastService.error(error.message || 'Erro ao excluir usuário.');
          },
        });
      });
  }

  private toggleStatus(user: UserDto): void {
    this.busyUuid.set(user.uuid);

    this.usersService.toggleStatus(user.uuid).subscribe({
      next: (updated) => {
        this.busyUuid.set(null);
        // Mantém as abilities da listagem: a resposta do toggle não traz mudança de permissão
        this.users.update((list) =>
          list.map((u) => (u.uuid === updated.uuid ? { ...u, is_active: updated.is_active } : u)),
        );
        this.toastService.success(
          updated.is_active ? `"${user.name}" foi reativado.` : `"${user.name}" foi desativado.`,
        );
      },
      error: (error: ApiErrorResponse) => {
        this.busyUuid.set(null);
        this.toastService.error(error.message || 'Erro ao alterar o status do usuário.');
      },
    });
  }
}
