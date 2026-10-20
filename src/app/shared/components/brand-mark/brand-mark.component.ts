import { Component, input } from '@angular/core';

/** Marca "headless": hexágono na cor primária com o miolo vazado. */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="brand-mark"
    >
      <path d="M12 2l8.7 5v10L12 22l-8.7-5V7z" fill="var(--app-primary)" />
      <path d="M12 7.5l4.3 2.5v5L12 17.5 7.7 15v-5z" fill="var(--app-on-primary)" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
})
export class BrandMarkComponent {
  public readonly size = input<number>(24);
}
