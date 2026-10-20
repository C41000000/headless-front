import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiErrorResponse, PaginationMeta, TenantDto } from '@core/models';
import { ToastService } from '@core/toast';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent implements OnInit {
  private readonly tenantsService = inject(TenantsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  public readonly tenants = signal<TenantDto[]>([]);
  public readonly meta = signal<PaginationMeta | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly deletingUuid = signal<string | null>(null);

  public ngOnInit(): void {
    const createdName = this.route.snapshot.queryParamMap.get('created');
    if (createdName) {
      this.toastService.success(`Tenant "${createdName}" criado e provisionado com sucesso!`);
      this.router.navigate([], { relativeTo: this.route, replaceUrl: true });
    }
    this.loadTenants(1);
  }

  public loadTenants(page = 1): void {
    this.isLoading.set(true);

    this.tenantsService.getTenants(page).subscribe({
      next: (response) => {
        this.tenants.set(response.data);
        this.meta.set(response.meta);
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.toastService.error(error.message || 'Erro ao carregar a lista de tenants.');
        this.isLoading.set(false);
      },
    });
  }

  public onDelete(tenant: TenantDto): void {
    const confirmed = window.confirm(
      `Deseja realmente remover o tenant "${tenant.name}"? Esta ação desvinculará seus domínios da resolução.`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingUuid.set(tenant.uuid);

    this.tenantsService.deleteTenant(tenant.uuid).subscribe({
      next: () => {
        this.deletingUuid.set(null);
        this.toastService.success(`Tenant "${tenant.name}" removido com sucesso.`);
        const currentPage = this.meta()?.current_page ?? 1;
        this.loadTenants(currentPage);
      },
      error: (error: ApiErrorResponse) => {
        this.deletingUuid.set(null);
        this.toastService.error(error.message || 'Erro ao remover tenant.');
      },
    });
  }
}
