export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMode: string;
  isCredit: boolean;
  partialPaymentAmount?: number;
  oldBalance?: number;
  /** When true, invoice dialog opens print flow after render (Invoices → Print action). */
  autoPrintAfterOpen?: boolean;
  shopGstStateCode?: string;
  totalTaxableAmount?: number;
  totalCgst?: number;
  totalSgst?: number;
}

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
  hsnCode?: string;
  gstRatePercent?: number;
  taxableValue?: number;
  cgstAmount?: number;
  sgstAmount?: number;
}
