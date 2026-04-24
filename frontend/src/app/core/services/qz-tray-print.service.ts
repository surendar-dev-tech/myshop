import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { InvoiceData } from '../../sales/invoice-data.model';
import { ShopProfile } from './shop-profile.service';

/** Global injected by qz-tray.js (loaded at runtime when QZ Tray integration is enabled). */
declare global {
  interface Window {
    qz?: {
      websocket: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        isActive: () => boolean;
      };
      printers: {
        getDefault: () => Promise<string>;
        find: (query?: string) => Promise<string | string[]>;
      };
      configs: {
        create: (printer: string, options?: Record<string, unknown>) => unknown;
      };
      print: (config: unknown, data: Array<{ type: string; format: string; data: string }>) => Promise<void>;
    };
  }
}

/**
 * Optional integration with QZ Tray for direct thermal / receipt printing without the browser print dialog.
 * Requires QZ Tray installed on the workstation and {@link environment.qzTray.enabled}.
 *
 * Production: configure QZ signing (certificate + signature endpoint) — see https://qz.io/wiki/2.0-signing
 */
@Injectable({ providedIn: 'root' })
export class QzTrayPrintService {
  private loadPromise: Promise<void> | null = null;

  constructor(private snackBar: MatSnackBar) {}

  isEnabled(): boolean {
    return environment.qzTray?.enabled === true;
  }

  /** Plain-text receipt for 58/80mm thermal printers (monospace-friendly). */
  buildPlainTextReceipt(invoice: InvoiceData, shop: ShopProfile): string {
    const w = 42;
    const line = '-'.repeat(w);
    const center = (s: string) => {
      const pad = Math.max(0, Math.floor((w - s.length) / 2));
      return ' '.repeat(pad) + s;
    };
    const shopName = shop.shopName || 'MyShop';
    const rows: string[] = [
      center(shopName),
      line,
      `Invoice: ${invoice.invoiceNumber}`,
      `Date: ${new Date(invoice.date).toLocaleString()}`
    ];
    if (invoice.customerName) {
      rows.push(`Customer: ${invoice.customerName}`);
    }
    if (invoice.customerPhone) {
      rows.push(`Phone: ${invoice.customerPhone}`);
    }
    rows.push(line, 'Item'.padEnd(18) + 'Qty'.padStart(6) + 'Total'.padStart(10));
    for (const it of invoice.items) {
      const name = (it.productName || '').slice(0, 16);
      const qty = `${Number(it.quantity)} ${it.unit || ''}`.trim().slice(0, 6);
      const tot = it.total.toFixed(2);
      rows.push(name.padEnd(18) + qty.padStart(6) + tot.padStart(10));
    }
    if (invoice.totalTaxableAmount != null && invoice.totalTaxableAmount > 0) {
      rows.push(`Taxable`.padEnd(32) + invoice.totalTaxableAmount.toFixed(2).padStart(10));
    }
    if (invoice.totalCgst != null && invoice.totalCgst > 0) {
      rows.push(`CGST`.padEnd(32) + invoice.totalCgst.toFixed(2).padStart(10));
    }
    if (invoice.totalSgst != null && invoice.totalSgst > 0) {
      rows.push(`SGST`.padEnd(32) + invoice.totalSgst.toFixed(2).padStart(10));
    }
    rows.push(
      line,
      `Subtotal`.padEnd(32) + invoice.subtotal.toFixed(2).padStart(10),
      invoice.discount > 0
        ? `Discount`.padEnd(32) + `-${invoice.discount.toFixed(2)}`.padStart(10)
        : '',
      `TOTAL`.padEnd(32) + invoice.total.toFixed(2).padStart(10),
      `Payment: ${invoice.paymentMode}`,
      line,
      center('Thank you'),
      ''
    );
    return rows.filter(Boolean).join('\n');
  }

  async printPlainTextReceipt(invoice: InvoiceData, shop: ShopProfile): Promise<void> {
    const text = this.buildPlainTextReceipt(invoice, shop);
    const escInit = '\x1B@';
    const data = escInit + text.replace(/\n/g, '\r\n');
    await this.printRawPlain(data);
  }

  private async ensureQzLoaded(): Promise<NonNullable<Window['qz']>> {
    if (window.qz) {
      return window.qz;
    }
    const url = environment.qzTray?.scriptUrl;
    if (!url) {
      throw new Error('QZ Tray script URL not configured');
    }
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load QZ Tray script'));
        document.head.appendChild(s);
      });
    }
    await this.loadPromise;
    if (!window.qz) {
      throw new Error('QZ Tray API not available after load');
    }
    return window.qz;
  }

  private async printRawPlain(raw: string): Promise<void> {
    const qz = await this.ensureQzLoaded();

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }

    const printer = await qz.printers.getDefault();
    if (!printer) {
      throw new Error('No default printer in QZ Tray. Set a default printer in Windows / QZ.');
    }

    const config = qz.configs.create(printer);
    await qz.print(config, [{ type: 'raw', format: 'plain', data: raw }]);
  }

  /**
   * Entry point from UI: prints via QZ or shows why it failed.
   */
  async printInvoiceOrNotify(invoice: InvoiceData, shop: ShopProfile): Promise<void> {
    if (!this.isEnabled()) {
      this.snackBar.open('Enable qzTray in environment.ts and install QZ Tray on this PC.', 'Close', {
        duration: 6000
      });
      return;
    }
    try {
      await this.printPlainTextReceipt(invoice, shop);
      this.snackBar.open('Sent to printer (QZ Tray)', 'Close', { duration: 2500 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.snackBar.open('QZ print failed: ' + msg, 'Close', { duration: 7000 });
    }
  }
}
