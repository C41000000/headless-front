import { lighten, parseHexColor, readableTextColor, toHex } from './brand-colors';

describe('brand colors', () => {
  it('should parse the hex formats accepted by the API', () => {
    expect(parseHexColor('#0D6EFD')).toEqual({ r: 13, g: 110, b: 253 });
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('#0D6EFD80')).toEqual({ r: 13, g: 110, b: 253 });
    expect(parseHexColor('azul')).toBeNull();
  });

  it('should lighten towards white', () => {
    expect(toHex(lighten({ r: 0, g: 0, b: 0 }, 0.5))).toBe('#808080');
  });

  it('should pick the text color with more contrast', () => {
    expect(readableTextColor({ r: 13, g: 110, b: 253 })).toBe('#ffffff');
    expect(readableTextColor({ r: 255, g: 193, b: 7 })).toBe('#14171c');
  });
});
