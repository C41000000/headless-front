import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Hsv, hexToHsv, hsvToHex, normalizeHex } from './color-utils';

/** Cores sugeridas quando o uso não informa as suas. */
const DEFAULT_PRESETS = [
  '#D9501C',
  '#E11D48',
  '#C026D3',
  '#7C3AED',
  '#4F46E5',
  '#0D6EFD',
  '#0891B2',
  '#0E6F68',
  '#16A34A',
  '#CA8A04',
  '#6C757D',
  '#14171C',
];

const KEY_STEP = 0.01;
const KEY_STEP_LARGE = 0.1;

/**
 * Seletor de cor no estilo do painel: amostra que abre um popover com área de
 * saturação/brilho, faixa de matiz, campo hex e cores sugeridas. Emite `#RRGGBB`
 * (preserva o alfa de um `#RRGGBBAA` recebido).
 *
 * Use como controle de formulário (`formControlName`) quando ele for o único
 * campo da cor, ou com `[color]`/`(colorChange)` quando dividir o controle com
 * outro campo (ex.: um input de texto): dois acessores no mesmo FormControl não
 * se atualizam entre si.
 */
@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
export class ColorPickerComponent implements ControlValueAccessor {
  /** Nome da cor para leitores de tela (ex.: "primária"). */
  public readonly label = input<string>('cor');
  public readonly presets = input<readonly string[]>(DEFAULT_PRESETS);
  /** Cor atual, para uso sem formControlName. */
  public readonly color = input<string | null | undefined>(undefined);
  public readonly disabled = input<boolean>(false);
  public readonly colorChange = output<string>();

  private readonly svArea = viewChild<ElementRef<HTMLElement>>('svArea');

  public readonly isOpen = signal<boolean>(false);
  private readonly cvaDisabled = signal<boolean>(false);
  public readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  public readonly hsv = signal<Hsv>({ h: 0, s: 0, v: 0 });
  /** Valor atual é uma cor válida? (vazio ou inválido mostra o xadrez na amostra) */
  public readonly hasColor = signal<boolean>(false);
  /** Texto do campo hex dentro do popover, editável livremente até confirmar. */
  public readonly hexDraft = signal<string>('');

  /** Sufixo de alfa (#RRGGBBAA) recebido, mantido ao mexer no seletor. */
  private alphaSuffix = '';

  public readonly hex = computed(() => hsvToHex(this.hsv()));
  public readonly hueColor = computed(() => hsvToHex({ h: this.hsv().h, s: 1, v: 1 }));

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const color = this.color();
      // Ignora o eco do próprio valor: reconverter um cinza/preto zeraria a matiz arrastada
      if (color !== undefined && normalizeHex(color ?? '') !== this.currentValue()) {
        this.writeValue(color);
      }
    });
  }

  // ControlValueAccessor

  public writeValue(value: string | null): void {
    const normalized = value ? normalizeHex(value) : null;
    const hsv = normalized ? hexToHsv(normalized) : null;
    this.hasColor.set(hsv !== null);
    this.alphaSuffix = normalized && normalized.length === 9 ? normalized.slice(7) : '';
    if (hsv) {
      this.hsv.set(hsv);
    }
    this.hexDraft.set(normalized ?? '');
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
    if (isDisabled) {
      this.isOpen.set(false);
    }
  }

  // Popover

  public toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    this.isOpen() ? this.close() : this.open();
  }

  public open(): void {
    this.hexDraft.set(this.hasColor() ? this.hex() : '');
    this.isOpen.set(true);
    // Foca a área de saturação para já dar para usar as setas
    setTimeout(() => this.svArea()?.nativeElement.focus());
  }

  public close(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.onTouched();
    }
  }

  // Área de saturação (x) e brilho (y)

  public onSvPointerDown(event: PointerEvent): void {
    const area = event.currentTarget as HTMLElement;
    area.setPointerCapture(event.pointerId);
    this.updateFromPointer(event, area);
  }

  public onSvPointerMove(event: PointerEvent): void {
    const area = event.currentTarget as HTMLElement;
    if (area.hasPointerCapture(event.pointerId)) {
      this.updateFromPointer(event, area);
    }
  }

  public onSvKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const { s, v } = this.hsv();
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) {
      return;
    }
    event.preventDefault();
    this.setHsv({ ...this.hsv(), s: clamp(s + move[0]), v: clamp(v + move[1]) });
  }

  // Matiz

  public onHueInput(event: Event): void {
    this.setHsv({ ...this.hsv(), h: Number((event.target as HTMLInputElement).value) });
  }

  // Campo hex e cores sugeridas

  public onHexInput(event: Event): void {
    this.hexDraft.set((event.target as HTMLInputElement).value);
  }

  /** Aplica o hex digitado (Enter ou ao sair do campo); se for inválido, volta ao atual. */
  public commitHexDraft(): void {
    const normalized = normalizeHex(this.hexDraft());
    const hsv = normalized ? hexToHsv(normalized) : null;
    if (!normalized || !hsv) {
      this.hexDraft.set(this.hasColor() ? this.currentValue() : '');
      return;
    }
    this.alphaSuffix = normalized.length === 9 ? normalized.slice(7) : '';
    this.setHsv(hsv);
  }

  public pickPreset(color: string): void {
    const hsv = hexToHsv(color);
    if (hsv) {
      this.alphaSuffix = '';
      this.setHsv(hsv);
    }
  }

  public currentValue(): string {
    return this.hex() + this.alphaSuffix;
  }

  private updateFromPointer(event: PointerEvent, area: HTMLElement): void {
    const rect = area.getBoundingClientRect();
    this.setHsv({
      ...this.hsv(),
      s: clamp((event.clientX - rect.left) / rect.width),
      v: clamp(1 - (event.clientY - rect.top) / rect.height),
    });
  }

  private setHsv(hsv: Hsv): void {
    this.hsv.set(hsv);
    this.hasColor.set(true);
    const value = this.currentValue();
    this.hexDraft.set(value);
    this.onChange(value);
    this.colorChange.emit(value);
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
