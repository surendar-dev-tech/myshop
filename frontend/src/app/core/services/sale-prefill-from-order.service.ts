import { Injectable } from '@angular/core';
import { CustomerOrderDto } from './customer-order.service';

/** Passed to Sales (POS) when staff opens an online order to review and complete the sale. */
export interface SalePrefillFromOrder {
  customerOrderId: number;
  orderNumber?: string;
  customerId?: number;
  items: { productId: number; quantity: number; unitPrice: number; lineDiscount: number }[];
  billDiscount: number;
  paymentMode: string;
}

@Injectable({ providedIn: 'root' })
export class SalePrefillFromOrderService {
  private draft: SalePrefillFromOrder | null = null;

  setFromOrder(o: CustomerOrderDto): void {
    this.draft = {
      customerOrderId: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      items: (o.items || []).map((it) => ({
        productId: it.productId!,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineDiscount: 0
      })),
      billDiscount: o.discount ?? 0,
      paymentMode: o.paymentMode || 'CASH'
    };
  }

  /** Clears the draft; call once when Sales applies it. */
  consume(): SalePrefillFromOrder | null {
    const d = this.draft;
    this.draft = null;
    return d;
  }
}
