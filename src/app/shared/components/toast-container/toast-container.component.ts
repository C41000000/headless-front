import { Component, inject } from '@angular/core';
import { ToastService } from '@core/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  public readonly toastService = inject(ToastService);

  public onClose(id: string): void {
    this.toastService.remove(id);
  }
}
