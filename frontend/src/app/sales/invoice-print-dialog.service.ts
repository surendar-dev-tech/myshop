import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InvoicePrintComponent } from './invoice-print.component';
import { InvoiceData } from './invoice-data.model';

@Injectable({ providedIn: 'root' })
export class InvoicePrintDialogService {
  constructor(private dialog: MatDialog) {}

  open(invoiceData: InvoiceData): MatDialogRef<InvoicePrintComponent> {
    return this.dialog.open(InvoicePrintComponent, {
      width: '920px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'invoice-print-dialog-panel',
      autoFocus: false,
      data: invoiceData
    });
  }
}
