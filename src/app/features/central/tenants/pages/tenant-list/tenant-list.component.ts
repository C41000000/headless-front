import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiErrorResponse, PaginationMeta, TenantDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent implements OnInit {
  private readonly tenantsService = inject(TenantsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  public readonly displayedColumns: string[] = ['name', 'domains', 'created_at', 'actions'];
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

  public onPageChange(event: PageEvent): void {
    const targetPage = event.pageIndex + 1;
    this.loadTenants(targetPage);
  }

  public onDelete(tenant: TenantDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Remover Tenant',
        message: `Deseja realmente remover o tenant "${tenant.name}"? Esta ação desvinculará seus domínios da plataforma.`,
        confirmText: 'Sim, remover',
        cancelText: 'Cancelar',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
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
    });
  }
}
