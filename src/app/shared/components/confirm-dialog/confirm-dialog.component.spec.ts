import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefMock: { close: (val?: unknown) => void };

  const testData: ConfirmDialogData = {
    title: 'Excluir Item',
    message: 'Tem certeza que deseja excluir?',
    confirmText: 'Sim, excluir',
    cancelText: 'Voltar',
    color: 'warn',
  };

  beforeEach(async () => {
    dialogRefMock = { close: () => {} };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: testData },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the confirm dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title and message from injected data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Excluir Item');
    expect(compiled.textContent).toContain('Tem certeza que deseja excluir?');
  });

  it('should call dialogRef.close(true) on confirm', () => {
    let closedValue: unknown = null;
    dialogRefMock.close = (val) => {
      closedValue = val;
    };

    component.onConfirm();
    expect(closedValue).toBe(true);
  });

  it('should call dialogRef.close(false) on cancel', () => {
    let closedValue: unknown = null;
    dialogRefMock.close = (val) => {
      closedValue = val;
    };

    component.onCancel();
    expect(closedValue).toBe(false);
  });
});
