import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, BannerDto, BannerTarget, CreateBannerDto } from '@core/models';
import { ToastService } from '@core/toast';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog';
import { startWith } from 'rxjs';
import { BANNER_STATUS_LABELS, SUGGESTED_PLACEMENTS, bannerStatus } from '../../banner-status';
import { BannersService } from '../../services/banners.service';

const URL_PATTERN = /^https?:\/\/\S+$/i;

/** Converte ISO 8601 (UTC) para o valor de um <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

/** Espelha o `after_or_equal:starts_at` do backend. */
function scheduleValidator(group: AbstractControl): ValidationErrors | null {
  const starts = group.get('starts_at')?.value as string;
  const ends = group.get('ends_at')?.value as string;
  return starts && ends && ends < starts ? { endsBeforeStart: true } : null;
}

@Component({
  selector: 'app-banner-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './banner-form.component.html',
  styleUrl: './banner-form.component.scss',
})
export class BannerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bannersService = inject(BannersService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  protected readonly placements = SUGGESTED_PLACEMENTS;
  protected readonly statusLabels = BANNER_STATUS_LABELS;

  public readonly banner = signal<BannerDto | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);
  public readonly isDeleting = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});
  public readonly previewBroken = signal<boolean>(false);

  private readonly uuid = this.route.snapshot.paramMap.get('uuid');
  public readonly isEdit = this.uuid !== null;
  public readonly canSave = computed(() =>
    this.session.can(this.isEdit ? 'banners.update' : 'banners.create'),
  );
  public readonly canDelete = computed(() => this.isEdit && this.session.can('banners.delete'));
  public readonly status = computed(() => {
    const banner = this.banner();
    return banner ? bannerStatus(banner) : null;
  });

  public readonly form = this.fb.nonNullable.group(
    {
      image_url: [
        '',
        [Validators.required, Validators.pattern(URL_PATTERN), Validators.maxLength(2048)],
      ],
      mobile_image_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
      title: ['', [Validators.maxLength(255)]],
      // A coluna no banco é varchar(255), embora o FormRequest aceite até 1000
      subtitle: ['', [Validators.maxLength(255)]],
      link_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
      target: this.fb.nonNullable.control<BannerTarget>('_self'),
      placement: ['home', [Validators.required, Validators.maxLength(50)]],
      order: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
      starts_at: [''],
      ends_at: [''],
    },
    { validators: scheduleValidator },
  );

  /** Valores do formulário em signal, para a prévia acompanhar a digitação. */
  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  public readonly preview = computed(() => {
    const value = this.formValue();
    return {
      image: value.image_url && URL_PATTERN.test(value.image_url) ? value.image_url : null,
      title: value.title,
      subtitle: value.subtitle,
    };
  });

  public ngOnInit(): void {
    if (this.uuid) {
      this.loadBanner(this.uuid);
    }
    if (!this.canSave()) {
      this.form.disable();
    }
  }

  public onPreviewError(): void {
    this.previewBroken.set(true);
  }

  public onImageUrlInput(): void {
    this.previewBroken.set(false);
  }

  public onSubmit(): void {
    if (this.isSaving() || !this.canSave()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const banner = this.banner();

    if (banner) {
      // PATCH parcial: só os campos alterados
      const changes = this.changedFields(payload, banner);
      if (Object.keys(changes).length === 0) {
        this.toastService.info('Nenhuma alteração para salvar.');
        return;
      }
      this.save(this.bannersService.updateBanner(banner.uuid, changes), 'Banner atualizado!');
    } else {
      this.save(this.bannersService.createBanner(payload), 'Banner criado!');
    }
  }

  public onDelete(): void {
    const banner = this.banner();
    if (!banner) {
      return;
    }

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
        this.isDeleting.set(true);
        this.bannersService.deleteBanner(banner.uuid).subscribe({
          next: () => {
            this.toastService.success('Banner excluído.');
            this.router.navigate(['/painel/banners']);
          },
          error: (error: ApiErrorResponse) => {
            this.isDeleting.set(false);
            this.toastService.error(error.message || 'Erro ao excluir o banner.');
          },
        });
      });
  }

  private save(request: ReturnType<BannersService['createBanner']>, message: string): void {
    this.isSaving.set(true);
    this.validationErrors.set({});

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success(message);
        this.router.navigate(['/painel/banners']);
      },
      error: (error: ApiErrorResponse) => {
        this.isSaving.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        this.toastService.error(error.message || 'Erro ao salvar o banner.');
      },
    });
  }

  private buildPayload(): CreateBannerDto {
    const raw = this.form.getRawValue();
    const orNull = (value: string): string | null => value.trim() || null;

    return {
      image_url: raw.image_url.trim(),
      mobile_image_url: orNull(raw.mobile_image_url),
      title: orNull(raw.title),
      subtitle: orNull(raw.subtitle),
      link_url: orNull(raw.link_url),
      target: raw.target,
      placement: raw.placement.trim(),
      order: Number(raw.order),
      is_active: raw.is_active,
      starts_at: toIso(raw.starts_at),
      ends_at: toIso(raw.ends_at),
    };
  }

  private changedFields(payload: CreateBannerDto, banner: BannerDto): Partial<CreateBannerDto> {
    const changes: Partial<CreateBannerDto> = {};
    const sameDate = (a: string | null | undefined, b: string | null): boolean =>
      (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

    for (const key of Object.keys(payload) as (keyof CreateBannerDto)[]) {
      const value = payload[key];
      const current = banner[key];
      const unchanged =
        key === 'starts_at' || key === 'ends_at'
          ? sameDate(value as string | null, current as string | null)
          : value === current;
      if (!unchanged) {
        Object.assign(changes, { [key]: value });
      }
    }
    return changes;
  }

  private loadBanner(uuid: string): void {
    this.isLoading.set(true);

    this.bannersService.getBanner(uuid).subscribe({
      next: (banner) => {
        this.banner.set(banner);
        this.form.setValue({
          image_url: banner.image_url,
          mobile_image_url: banner.mobile_image_url ?? '',
          title: banner.title ?? '',
          subtitle: banner.subtitle ?? '',
          link_url: banner.link_url ?? '',
          target: banner.target,
          placement: banner.placement,
          order: banner.order,
          is_active: banner.is_active,
          starts_at: toLocalInput(banner.starts_at),
          ends_at: toLocalInput(banner.ends_at),
        });
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(error.message || 'Erro ao carregar o banner.');
        this.router.navigate(['/painel/banners']);
      },
    });
  }
}
