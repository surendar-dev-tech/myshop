import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SaleService, Sale } from '../core/services/sale.service';
import { saleToInvoiceData } from '../sales/invoice-from-sale';
import { InvoicePrintDialogService } from '../sales/invoice-print-dialog.service';
import {
  AccountPaymentDialogComponent,
  AccountPaymentPrefill
} from './account-payment-dialog.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit {
  displayedColumns = ['invoiceNumber', 'date', 'customer', 'total', 'paymentMode', 'credit', 'actions'];
  dataSource = new MatTableDataSource<Sale>([]);
  loading = true;
  /** Row busy for any async action (view / print / etc.). */
  actionLoadingId: number | null = null;
  /** Sale for the row whose action menu is open (single shared menu). */
  actionSale: Sale | null = null;

  constructor(
    private saleService: SaleService,
    private invoicePrintDialog: InvoicePrintDialogService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;
    this.saleService.getAllSales().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.dataSource.data = res.data;
        } else {
          this.dataSource.data = [];
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Could not load invoices', 'Close', { duration: 4000 });
      }
    });
  }

  setActionSale(sale: Sale): void {
    this.actionSale = sale;
  }

  private openInvoiceForSale(sale: Sale, autoPrint: boolean): void {
    if (!sale?.id) {
      return;
    }
    this.actionLoadingId = sale.id;
    this.saleService.getSaleById(sale.id).subscribe({
      next: (res) => {
        this.actionLoadingId = null;
        if (res.success && res.data) {
          const data = saleToInvoiceData(res.data);
          data.autoPrintAfterOpen = autoPrint;
          this.invoicePrintDialog.open(data);
        } else {
          this.snackBar.open('Could not load invoice details', 'Close', { duration: 4000 });
        }
      },
      error: () => {
        this.actionLoadingId = null;
        this.snackBar.open('Could not load invoice details', 'Close', { duration: 4000 });
      }
    });
  }

  viewInvoice(): void {
    const sale = this.actionSale;
    if (!sale) {
      return;
    }
    this.openInvoiceForSale(sale, false);
  }

  printInvoiceFromMenu(): void {
    const sale = this.actionSale;
    if (!sale) {
      return;
    }
    this.openInvoiceForSale(sale, true);
  }

  recordPaymentForSale(): void {
    const sale = this.actionSale;
    if (!sale?.customerId) {
      this.snackBar.open('This invoice has no customer — use Record payment above to pick a customer.', 'Close', {
        duration: 5000
      });
      return;
    }
    const prefill: AccountPaymentPrefill = {
      customerId: sale.customerId,
      customerName: sale.customerName || undefined
    };
    this.dialog
      .open(AccountPaymentDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        data: prefill
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.loadSales();
        }
      });
  }

  onEditInvoice(): void {
    this.snackBar.open(
      'Posted invoices cannot be edited. Create a new sale from Sales or adjust credit from the customer record.',
      'Close',
      { duration: 6000 }
    );
  }

  openRecordPayment(): void {
    this.dialog
      .open(AccountPaymentDialogComponent, {
        width: '500px',
        maxWidth: '95vw'
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.loadSales();
        }
      });
  }
}
