import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from './toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public show(message: string, type: ToastType = 'info', title?: string, duration = 4000): void {
    // Evita duplicar o mesmo toast caso requisições concorrentes ocorram
    const alreadyExists = this._toasts().some(
      (t) => t.message === message && t.type === type,
    );
    if (alreadyExists) {
      return;
    }

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9);

    const newToast: Toast = {
      id,
      type,
      message,
      title,
      duration,
    };

    this._toasts.update((current) => [...current, newToast]);

    if (duration > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public success(message: string, title = 'Sucesso', duration = 4000): void {
    this.show(message, 'success', title, duration);
  }

  public error(message: string, title = 'Erro', duration = 5000): void {
    this.show(message, 'error', title, duration);
  }

  public info(message: string, title = 'Informação', duration = 4000): void {
    this.show(message, 'info', title, duration);
  }

  public warning(message: string, title = 'Atenção', duration = 4000): void {
    this.show(message, 'warning', title, duration);
  }

  public remove(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
