interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Converte #RGB, #RRGGBB ou #RRGGBBAA (formatos aceitos pela API) em RGB; ignora o alfa. */
export function parseHexColor(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value.slice(0, 6);

  if (!/^[0-9a-f]{6}$/i.test(full)) {
    return null;
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/** Mistura a cor com branco (`amount` de 0 a 1), para usá-la sobre fundo escuro. */
export function lighten(color: Rgb, amount: number): Rgb {
  return {
    r: color.r + (255 - color.r) * amount,
    g: color.g + (255 - color.g) * amount,
    b: color.b + (255 - color.b) * amount,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Contraste mínimo (WCAG para texto grande e componentes) para manter o texto branco. */
const MIN_WHITE_CONTRAST = 3;

/**
 * Texto sobre a cor da marca: branco sempre que o contraste for suficiente para
 * botões (é o que as marcas costumam esperar, ex.: azul com texto branco), senão
 * quase preto.
 */
export function readableTextColor(background: Rgb): string {
  const contrastWithWhite = 1.05 / (relativeLuminance(background) + 0.05);
  return contrastWithWhite >= MIN_WHITE_CONTRAST ? '#ffffff' : '#14171c';
}
