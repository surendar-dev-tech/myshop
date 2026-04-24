import { Sale } from '../core/services/sale.service';
import { InvoiceData, InvoiceItem } from './invoice-data.model';

/** Maps API sale (with line items) to the printable invoice model. */
export function saleToInvoiceData(sale: Sale): InvoiceData {
  const items: InvoiceItem[] = (sale.items || []).map((it) => ({
    productName: it.productName || 'Item',
    quantity: Number(it.quantity),
    unit: it.productUnit || 'piece',
    unitPrice: Number(it.unitPrice),
    discount: Number(it.discount ?? 0),
    total: Number(it.totalPrice),
    hsnCode: it.hsnCode,
    gstRatePercent:
      it.gstRatePercent != null ? Number(it.gstRatePercent) : undefined,
    taxableValue: it.taxableValue != null ? Number(it.taxableValue) : undefined,
    cgstAmount: it.cgstAmount != null ? Number(it.cgstAmount) : undefined,
    sgstAmount: it.sgstAmount != null ? Number(it.sgstAmount) : undefined
  }));

  const discount = Number(sale.discount ?? 0);
  const totalAmount = Number(sale.totalAmount ?? 0);
  const finalAmount = Number(sale.finalAmount ?? 0);

  const hasGst =
    (sale.totalCgst != null && Number(sale.totalCgst) > 0) ||
    (sale.totalSgst != null && Number(sale.totalSgst) > 0);

  return {
    invoiceNumber: sale.invoiceNumber,
    date: sale.createdAt,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    customerAddress: sale.customerAddress,
    items,
    subtotal: totalAmount || items.reduce((s, r) => s + r.total, 0),
    discount,
    total: finalAmount,
    paymentMode: sale.paymentMode,
    isCredit: !!sale.isCredit,
    partialPaymentAmount:
      sale.partialPaymentAmount != null ? Number(sale.partialPaymentAmount) : 0,
    shopGstStateCode: sale.shopGstStateCode,
    totalTaxableAmount:
      hasGst && sale.totalTaxableAmount != null ? Number(sale.totalTaxableAmount) : undefined,
    totalCgst: hasGst && sale.totalCgst != null ? Number(sale.totalCgst) : undefined,
    totalSgst: hasGst && sale.totalSgst != null ? Number(sale.totalSgst) : undefined
  };
}
