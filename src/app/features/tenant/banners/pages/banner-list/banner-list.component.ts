import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, BannerDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { BANNER_STATUS_LABELS, BannerStatus, bannerStatus } from '../../banner-status';
import { BannersService } from '../../services/banners.service';

type StatusFilter = 'all' | BannerStatus;

@Component({
  selector: 'app-banner-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './banner-list.component.html',
  styleUrl: './banner-list.component.scss',
})
export class BannerListComponent implements OnInit {
  private readonly bannersService = inject(BannersService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  protected readonly statusLabels = BANNER_STATUS_LABELS;
  protected readonly statusOptions = Object.keys(BANNER_STATUS_LABELS) as BannerStatus[];

  public readonly displayedColumns: string[] = [
    'banner',
    'placement',
    'schedule',
    'order',
    'active',
    'actions',
  ];
  public readonly banners = signal<BannerDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly busyUuid = signal<string | null>(null);
  /** Imagens que falharam ao carregar, para mostrar o marcador no lugar. */
  public readonly brokenImages = signal<ReadonlySet<string>>(new Set());

  public readonly search = signal<string>('');
  public readonly placementFilter = signal<string | null>(null);
  public readonly statusFilter = signal<StatusFilter>('all');

  public readonly canCreate = computed(() => this.session.can('banners.create'));
  public readonly canUpdate = computed(() => this.session.can('banners.update'));
  public readonly canDelete = computed(() => this.session.can('banners.delete'));

  /** A API devolve todos os banners de uma vez, então busca e filtros são locais. */
  public readonly placements = computed(() =>
    [...new Set(this.banners().map((banner) => banner.placement))].sort(),
  );
  public readonly filteredBanners = computed(() => {
    const term = this.search().trim().toLowerCase();
    const placement = this.placementFilter();
    const status = this.statusFilter();

    return this.banners().filter(
      (banner) =>
        (!term || `${banner.title ?? ''} ${banner.subtitle ?? ''}`.toLowerCase().includes(term)) &&
        (!placement || banner.placement === placement) &&
        (status === 'all' || bannerStatus(banner) === status),
    );
  });
  public readonly liveCount = computed(
    () => this.banners().filter((banner) => bannerStatus(banner) === 'live').length,
  );
  public readonly hasFilters = computed(
    () => !!this.search() || this.placementFilter() !== null || this.statusFilter() !== 'all',
  );

  public ngOnInit(): void {
    this.loadBanners();
  }

  public statusOf(banner: BannerDto): BannerStatus {
    return bannerStatus(banner);
  }

  public onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  public clearFilters(): void {
    this.search.set('');
    this.placementFilter.set(null);
    this.statusFilter.set('all');
  }

  public onImageError(uuid: string): void {
    this.brokenImages.update((set) => new Set(set).add(uuid));
  }

  public loadBanners(): void {
    this.isLoading.set(true);

    this.bannersService.getBanners().subscribe({
      next: (banners) => {
        this.banners.set(banners);
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.toastService.error(error.message || 'Erro ao carregar os banners.');
        this.isLoading.set(false);
      },
    });
  }

  public onToggleActive(banner: BannerDto, event: MatSlideToggleChange): void {
    // O toggle só muda de verdade quando a API confirmar
    event.source.checked = banner.is_active;
    this.busyUuid.set(banner.uuid);

    this.bannersService.updateBanner(banner.uuid, { is_active: !banner.is_active }).subscribe({
      next: (updated) => {
        this.busyUuid.set(null);
        this.banners.update((list) => list.map((b) => (b.uuid === updated.uuid ? updated : b)));
        this.toastService.success(
          updated.is_active ? 'Banner ativado.' : 'Banner desativado: ele sai do ar.',
        );
      },
      error: (error: ApiErrorResponse) => {
        this.busyUuid.set(null);
        this.toastService.error(error.message || 'Erro ao alterar o banner.');
      },
    });
  }

  public onDelete(banner: BannerDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Excluir Banner',
          message: `Deseja realmente excluir o banner "${banner.title || 'sem título'}"? Ele sai do ar imediatamente.`,
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

        this.busyUuid.set(banner.uuid);

        this.bannersService.deleteBanner(banner.uuid).subscribe({
          next: () => {
            this.busyUuid.set(null);
            this.banners.update((list) => list.filter((b) => b.uuid !== banner.uuid));
            this.toastService.success('Banner excluído.');
          },
          error: (error: ApiErrorResponse) => {
            this.busyUuid.set(null);
            this.toastService.error(error.message || 'Erro ao excluir o banner.');
          },
        });
      });
  }
}
