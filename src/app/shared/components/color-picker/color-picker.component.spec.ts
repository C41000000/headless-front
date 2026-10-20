import { TestBed } from '@angular/core/testing';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorPickerComponent', () => {
  const create = () => {
    TestBed.configureTestingModule({ imports: [ColorPickerComponent] });
    const fixture = TestBed.createComponent(ColorPickerComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should read the form value and notify changes in #RRGGBB', () => {
    const picker = create();
    const onChange = vi.fn();
    const emitted: string[] = [];
    picker.registerOnChange(onChange);
    picker.colorChange.subscribe((color) => emitted.push(color));

    picker.writeValue('#0d6');
    expect(picker.hasColor()).toBe(true);
    expect(picker.currentValue()).toBe('#00DD66');

    picker.pickPreset('#D9501C');
    expect(onChange).toHaveBeenCalledWith('#D9501C');
    expect(emitted).toEqual(['#D9501C']);
  });

  it('should keep the alpha of an #RRGGBBAA value', () => {
    const picker = create();
    picker.writeValue('#0D6EFD80');

    picker.onHueInput({ target: { value: '0' } } as unknown as Event);

    expect(picker.currentValue()).toMatch(/^#[0-9A-F]{6}80$/);
  });

  it('should ignore an invalid hex typed in the popover', () => {
    const picker = create();
    picker.writeValue('#0D6EFD');

    picker.onHexInput({ target: { value: 'azul' } } as unknown as Event);
    picker.commitHexDraft();

    expect(picker.currentValue()).toBe('#0D6EFD');
    expect(picker.hexDraft()).toBe('#0D6EFD');
  });
});
