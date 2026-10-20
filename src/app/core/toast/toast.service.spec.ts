import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let snackBarMock: { open: () => void };

  beforeEach(() => {
    snackBarMock = { open: () => {} };
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBarMock }],
    });
    service = TestBed.inject(ToastService);
  });

  it('should initialize with empty toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a success toast with reactive signal', () => {
    service.success('Operação realizada com sucesso!');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Operação realizada com sucesso!');
  });

  it('should add an error toast with reactive signal', () => {
    service.error('Ocorreu um erro.');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('Ocorreu um erro.');
  });

  it('should remove toast by id', () => {
    service.info('Info 1');
    const id = service.toasts()[0].id;
    service.remove(id);
    expect(service.toasts().length).toBe(0);
  });
});
