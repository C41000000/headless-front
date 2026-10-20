import { hexToHsv, hsvToHex, isHexColor, normalizeHex } from './color-utils';

describe('color utils', () => {
  it('should validate and normalize the hex formats accepted by the API', () => {
    expect(isHexColor('#0d6efd')).toBe(true);
    expect(isHexColor('0D6EFD')).toBe(true);
    expect(isHexColor('#0D6EFD80')).toBe(true);
    expect(isHexColor('#0D6')).toBe(true);
    expect(isHexColor('azul')).toBe(false);
    expect(normalizeHex('0d6')).toBe('#00DD66');
    expect(normalizeHex('#0d6efd')).toBe('#0D6EFD');
  });

  it('should convert between hex and hsv without losing the color', () => {
    for (const hex of ['#D9501C', '#0D6EFD', '#6C757D', '#FFC107', '#000000', '#FFFFFF']) {
      const hsv = hexToHsv(hex);
      expect(hsv).not.toBeNull();
      expect(hsvToHex(hsv!)).toBe(hex);
    }
  });

  it('should map pure colors to the expected hue', () => {
    expect(hexToHsv('#FF0000')).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv('#00FF00')?.h).toBe(120);
    expect(hexToHsv('#0000FF')?.h).toBe(240);
  });
});
