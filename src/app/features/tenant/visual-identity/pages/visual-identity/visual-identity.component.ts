import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AUTH_SESSION } from '@core/auth/auth-session';
import { ApiErrorResponse, UpdateVisualIdentityDto, VisualIdentityDto } from '@core/models';
import { TenantContextService, VisualIdentityService } from '@core/tenant';
import { parseHexColor, readableTextColor } from '@core/tenant/brand-colors';
import { ColorPickerComponent } from '@shared/components/color-picker';
import { ToastService } from '@core/toast';
import { startWith } from 'rxjs';
import { VisualIdentityAdminService } from '../../services/visual-identity-admin.service';

/** Mesma regex do UpdateVisualIdentityRequest: #RGB, #RRGGBB ou #RRGGBBAA. */
const HEX_PATTERN = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

type ColorField = 'primary_color' | 'secondary_color' | 'accent_color';

@Component({
  selector: 'app-visual-identity',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ColorPickerComponent,
  ],
  templateUrl: './visual-identity.component.html',
  styleUrl: './visual-identity.component.scss',
})
export class VisualIdentityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(VisualIdentityAdminService);
  private readonly visualIdentityService = inject(VisualIdentityService);
  private readonly session = inject(AUTH_SESSION);
  private readonly toastService = inject(ToastService);
  protected readonly tenantContext = inject(TenantContextService);

  protected readonly colorFields: { key: ColorField; label: string; name: string; hint: string }[] =
    [
      { key: 'primary_color', label: 'Primária', name: 'cor primária', hint: 'Botões e destaques' },
      {
        key: 'secondary_color',
        label: 'Secundária',
        name: 'cor secundária',
        hint: 'Links e etiquetas',
      },
      {
        key: 'accent_color',
        label: 'Acento (opcional)',
        name: 'cor de acento',
        hint: 'Detalhes pontuais',
      },
    ];

  public readonly identity = signal<VisualIdentityDto | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);
  public readonly validationErrors = signal<Record<string, string[]>>({});
  public readonly canUpdate = computed(() => this.session.can('visual-identity.update'));

  public readonly form = this.fb.nonNullable.group({
    primary_color: ['', [Validators.required, Validators.pattern(HEX_PATTERN)]],
    secondary_color: ['', [Validators.required, Validators.pattern(HEX_PATTERN)]],
    accent_color: ['', [Validators.pattern(HEX_PATTERN)]],
    logo_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
    logo_dark_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
    favicon_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(2048)]],
    font_family: ['', [Validators.maxLength(100)]],
    custom_css: ['', [Validators.maxLength(10000)]],
  });

  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  /** Cores da prévia: só usa o valor digitado quando ele é um hex válido. */
  public readonly preview = computed(() => {
    const value = this.formValue();
    const valid = (hex: string | undefined, fallback: string): string =>
      hex && HEX_PATTERN.test(hex) ? hex : fallback;
    const primary = valid(value.primary_color, '#6b7280');
    const rgb = parseHexColor(primary);

    return {
      primary,
      onPrimary: rgb ? readableTextColor(rgb) : '#ffffff',
      secondary: valid(value.secondary_color, '#6b7280'),
      accent: valid(value.accent_color, valid(value.secondary_color, '#6b7280')),
      logo: value.logo_url && URL_PATTERN.test(value.logo_url) ? value.logo_url : null,
      logoDark:
        value.logo_dark_url && URL_PATTERN.test(value.logo_dark_url) ? value.logo_dark_url : null,
      font: value.font_family || 'inherit',
    };
  });

  public readonly tenantInitial = computed(
    () => this.tenantContext.tenantDomain()?.charAt(0).toUpperCase() ?? 'T',
  );

  public readonly isDirty = computed(() => {
    this.formValue();
    return this.identity() !== null && Object.keys(this.changedFields()).length > 0;
  });

  public ngOnInit(): void {
    this.loadIdentity();
  }

  /** O seletor e o campo de texto dividem o controle; setValue atualiza os dois. */
  public onPickColor(field: ColorField, color: string): void {
    const control = this.form.controls[field];
    control.setValue(color);
    control.markAsDirty();
  }

  public onReset(): void {
    const identity = this.identity();
    if (identity) {
      this.fillForm(identity);
    }
    this.validationErrors.set({});
  }

  public onSubmit(): void {
    if (this.isSaving() || !this.canUpdate()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const changes = this.changedFields();
    if (Object.keys(changes).length === 0) {
      this.toastService.info('Nenhuma alteração para salvar.');
      return;
    }

    this.isSaving.set(true);
    this.validationErrors.set({});

    this.adminService.updateVisualIdentity(changes).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.identity.set(updated);
        this.fillForm(updated);
        // Aplica na hora: cores do painel, fonte, favicon e CSS customizado
        this.visualIdentityService.setVisualIdentity(updated);
        this.toastService.success('Identidade visual atualizada!');
      },
      error: (error: ApiErrorResponse) => {
        this.isSaving.set(false);
        if (error.errors) {
          this.validationErrors.set(error.errors);
        }
        this.toastService.error(error.message || 'Erro ao salvar a identidade visual.');
      },
    });
  }

  /** PATCH parcial: só os campos alterados; campo opcional vazio vira null. */
  private changedFields(): UpdateVisualIdentityDto {
    const identity = this.identity();
    if (!identity) {
      return {};
    }

    const raw = this.form.getRawValue();
    const changes: UpdateVisualIdentityDto = {};
    for (const key of Object.keys(raw) as (keyof typeof raw)[]) {
      const value = raw[key].trim() || null;
      if (value !== (identity[key] ?? null)) {
        changes[key] = value;
      }
    }
    return changes;
  }

  private fillForm(identity: VisualIdentityDto): void {
    this.form.reset({
      primary_color: identity.primary_color ?? '',
      secondary_color: identity.secondary_color ?? '',
      accent_color: identity.accent_color ?? '',
      logo_url: identity.logo_url ?? '',
      logo_dark_url: identity.logo_dark_url ?? '',
      favicon_url: identity.favicon_url ?? '',
      font_family: identity.font_family ?? '',
      custom_css: identity.custom_css ?? '',
    });
  }

  private loadIdentity(): void {
    this.isLoading.set(true);

    this.adminService.getVisualIdentity().subscribe({
      next: (identity) => {
        this.identity.set(identity);
        this.fillForm(identity);
        if (!this.canUpdate()) {
          this.form.disable();
        }
        this.isLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(error.message || 'Erro ao carregar a identidade visual.');
      },
    });
  }
}
