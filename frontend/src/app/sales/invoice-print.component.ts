import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShopProfileService, ShopProfile } from '../core/services/shop-profile.service';
import { DomSanitizer } from '@angular/platform-browser';
import { InvoiceData } from './invoice-data.model';
import { QzTrayPrintService } from '../core/services/qz-tray-print.service';
import { environment } from '../../environments/environment';

export type { InvoiceData, InvoiceItem } from './invoice-data.model';

@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './invoice-print.component.html',
  styleUrls: ['./invoice-print.component.scss']
})
export class InvoicePrintComponent implements OnInit, AfterViewInit {
  @ViewChild('invoicePrintRoot', { read: ElementRef }) invoicePrintRoot?: ElementRef<HTMLElement>;

  readonly qzTrayEnabled = environment.qzTray?.enabled === true;

  shopProfile: ShopProfile = {
    shopName: 'MyShop',
    invoiceTemplate: 'DEFAULT',
    printMode: 'POS',
    showLogo: false
  };
  customHeader: string = '';
  customFooter: string = '';

  constructor(
    public dialogRef: MatDialogRef<InvoicePrintComponent>,
    @Inject(MAT_DIALOG_DATA) public invoiceData: InvoiceData,
    private shopProfileService: ShopProfileService,
    public sanitizer: DomSanitizer,
    private qzTrayPrint: QzTrayPrintService
  ) {}

  ngOnInit(): void {
    this.loadShopProfile();
  }

  ngAfterViewInit(): void {
    if (this.invoiceData.autoPrintAfterOpen) {
      setTimeout(() => this.onPrint(), 400);
    }
  }

  loadShopProfile(): void {
    this.shopProfileService.getShopProfileCached().subscribe({
      next: (profile) => {
        this.shopProfile = profile;
        if (profile.invoiceHeader) {
          this.customHeader = profile.invoiceHeader;
        }
        if (profile.invoiceFooter) {
          this.customFooter = profile.invoiceFooter;
        }
      },
      error: (error) => {
        console.error('Error loading shop profile:', error);
      }
    });
  }

  getTemplateClass(): string {
    return `invoice-template-${this.shopProfile.invoiceTemplate?.toLowerCase() || 'default'}`;
  }

  getPrintModeClass(): string {
    return this.shopProfile.printMode?.toLowerCase() || 'pos';
  }

  /** Show HSN / split tax columns when any line has GST rate. */
  hasGstLines(): boolean {
    return (this.invoiceData.items || []).some(
      (it) => it.gstRatePercent != null && Number(it.gstRatePercent) > 0
    );
  }

  /**
   * Prints only the invoice HTML in a hidden iframe so the system print / preview
   * targets this document (not the whole app). The OS/browser print dialog still
   * appears — silent printing is not available from a normal web page.
   */
  onPrint(): void {
    const root = this.invoicePrintRoot?.nativeElement;
    if (!root) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Print');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;width:0;height:0;border:0;right:0;bottom:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    let cleaned = false;
    const cleanup = (): void => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      win.removeEventListener('afterprint', cleanup);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    try {
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="utf-8">');
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        doc.write(node.outerHTML);
      });
      doc.write('</head><body style="margin:0;background:#fff">');
      doc.write(root.outerHTML);
      doc.write('</body></html>');
      doc.close();

      win.addEventListener('afterprint', cleanup);

      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(cleanup, 4000);
      }, 100);
    } catch {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      window.print();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrintThermalQz(): void {
    void this.qzTrayPrint.printInvoiceOrNotify(this.invoiceData, this.shopProfile);
  }
}

