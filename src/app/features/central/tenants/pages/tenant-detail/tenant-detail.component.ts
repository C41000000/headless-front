import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiErrorResponse, DomainDto, TenantDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenant-detail',
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
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './tenant-detail.component.html',
  styleUrl: './tenant-detail.component.scss',
})
export class TenantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenantsService = inject(TenantsService);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  public readonly displayedColumns: string[] = ['domain', 'created_at', 'actions'];
  public readonly tenant = signal<TenantDto | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSavingName = signal<boolean>(false);
  public readonly isAddingDomain = signal<boolean>(false);
  public readonly editingDomainUuid = signal<string | null>(null);
  public readonly deletingDomainUuid = signal<string | null>(null);

  public readonly nameValidationErrors = signal<Record<string, string[]>>({});
  public readonly domainValidationErrors = signal<Record<string, string[]>>({});

  public readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

  public readonly newDomainControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[a-z0-9.-]+$/i)],
  });

  public readonly editDomainControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[a-z0-9.-]+$/i)],
  });

  private tenantUuid = '';

  public ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.router.navigate(['/admin/tenants']);
      return;
    }
    this.tenantUuid = uuid;
    this.loadTenant();
  }

  public loadTenant(): void {
    this.isLoading.set(true);

    this.tenantsService.getTenant(this.tenantUuid).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.nameControl.setValue(tenant.name);
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.toastService.error(error.message || 'Erro ao carregar detalhes do tenant.');
        this.isLoading.set(false);
      },
    });
  }

  public onSaveName(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }

    const newName = this.nameControl.value.trim();
    if (newName === this.tenant()?.name) {
      return;
    }

    this.isSavingName.set(true);
    this.nameValidationErrors.set({});

    this.tenantsService.updateTenant(this.tenantUuid, { name: newName }).subscribe({
      next: (updatedTenant) => {
        this.isSavingName.set(false);
        this.tenant.update((current) => (current ? { ...current, name: updatedTenant.name } : null));
        this.toastService.success('Nome do tenant atualizado com sucesso!');
      },
      error: (error: ApiErrorResponse) => {
        this.isSavingName.set(false);
        if (error.errors) {
          this.nameValidationErrors.set(error.errors);
        }
        const msg = error.message || 'Erro ao atualizar o nome do tenant.';
        this.toastService.error(msg);
      },
    });
  }

  public onAddDomain(): void {
    if (this.newDomainControl.invalid) {
      this.newDomainControl.markAsTouched();
      return;
    }

    const domain = this.newDomainControl.value.trim().toLowerCase();

    this.isAddingDomain.set(true);
    this.domainValidationErrors.set({});

    this.tenantsService.addDomain(this.tenantUuid, { domain }).subscribe({
      next: (newDomain) => {
        this.isAddingDomain.set(false);
        this.newDomainControl.reset();
        this.tenant.update((current) => {
          if (!current) return null;
          const currentDomains = current.domains ?? [];
          return {
            ...current,
            domains: [...currentDomains, newDomain],
          };
        });
        this.toastService.success(`Domínio "${domain}" adicionado com sucesso!`);
      },
      error: (error: ApiErrorResponse) => {
        this.isAddingDomain.set(false);
        if (error.errors) {
          this.domainValidationErrors.set(error.errors);
        }
        const msg = error.message || 'Erro ao adicionar domínio.';
        this.toastService.error(msg);
      },
    });
  }

  public startEditDomain(domain: DomainDto): void {
    this.editingDomainUuid.set(domain.uuid);
    this.editDomainControl.setValue(domain.domain);
    this.domainValidationErrors.set({});
  }

  public cancelEditDomain(): void {
    this.editingDomainUuid.set(null);
    this.editDomainControl.reset();
    this.domainValidationErrors.set({});
  }

  public onSaveEditDomain(domain: DomainDto): void {
    if (this.editDomainControl.invalid) {
      this.editDomainControl.markAsTouched();
      return;
    }

    const updatedDomain = this.editDomainControl.value.trim().toLowerCase();
    this.domainValidationErrors.set({});

    this.tenantsService
      .updateDomain(this.tenantUuid, domain.uuid, { domain: updatedDomain })
      .subscribe({
        next: (savedDomain) => {
          this.editingDomainUuid.set(null);
          this.tenant.update((current) => {
            if (!current) return null;
            const updatedList = (current.domains ?? []).map((d) =>
              d.uuid === domain.uuid ? savedDomain : d,
            );
            return { ...current, domains: updatedList };
          });
          this.toastService.success(`Domínio atualizado para "${updatedDomain}"!`);
        },
        error: (error: ApiErrorResponse) => {
          if (error.errors) {
            this.domainValidationErrors.set(error.errors);
          }
          const msg = error.message || 'Erro ao atualizar domínio.';
          this.toastService.error(msg);
        },
      });
  }

  public onDeleteDomain(domain: DomainDto): void {
    const domainsCount = this.tenant()?.domains?.length ?? 0;
    if (domainsCount <= 1) {
      this.toastService.warning('Não é possível remover o único domínio de um tenant ativo.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Remover Domínio',
        message: `Deseja realmente remover o domínio "${domain.domain}" deste tenant?`,
        confirmText: 'Sim, remover',
        cancelText: 'Cancelar',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.deletingDomainUuid.set(domain.uuid);

      this.tenantsService.deleteDomain(this.tenantUuid, domain.uuid).subscribe({
        next: () => {
          this.deletingDomainUuid.set(null);
          this.tenant.update((current) => {
            if (!current) return null;
            const filtered = (current.domains ?? []).filter((d) => d.uuid !== domain.uuid);
            return { ...current, domains: filtered };
          });
          this.toastService.success(`Domínio "${domain.domain}" removido com sucesso!`);
        },
        error: (error: ApiErrorResponse) => {
          this.deletingDomainUuid.set(null);
          const msg = error.message || 'Erro ao remover domínio.';
          this.toastService.error(msg);
        },
      });
    });
  }
}
