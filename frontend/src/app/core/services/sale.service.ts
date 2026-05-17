import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface SaleItem {
  productId: number;
  quantity: number;
  discount?: number;
  /** Per-unit selling price; omit to use catalog price on server */
  unitPrice?: number;
}

export interface SaleRequest {
  customerId?: number;
  items: SaleItem[];
  discount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  isCredit: boolean;
  partialPaymentAmount?: number; // Amount paid during credit sale
  /** Set when completing POS sale opened from Online orders */
  sourceCustomerOrderId?: number;
}

/** Line as returned by GET /sales/:id and list endpoints */
export interface SaleLineItem {
  id?: number;
  productId?: number;
  productName?: string;
  productUnit?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  hsnCode?: string;
  gstRatePercent?: number;
  taxableValue?: number;
  cgstAmount?: number;
  sgstAmount?: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMode: string;
  isCredit: boolean;
  createdAt: string;
  /** Amount paid at sale time for credit invoices (partial payment). */
  partialPaymentAmount?: number;
  shopGstStateCode?: string;
  totalTaxableAmount?: number;
  totalCgst?: number;
  totalSgst?: number;
  items: SaleLineItem[];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/sales`;

  private listCache: CacheEntry<ApiResponse<Sale[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust the sales list cache (called automatically on create). */
  invalidateCache(): void {
    this.listCache = null;
  }

  createSale(sale: SaleRequest): Observable<ApiResponse<Sale>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<Sale>>(this.apiUrl, sale);
  }

  getAllSales(): Observable<ApiResponse<Sale[]>> {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return of(this.listCache.data);
    }
    return this.http.get<ApiResponse<Sale[]>>(this.apiUrl).pipe(
      tap(r => { this.listCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  getSaleById(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.apiUrl}/${id}`);
  }

  getSalesByDateRange(startDate: string, endDate: string): Observable<ApiResponse<Sale[]>> {
    return this.http.get<ApiResponse<Sale[]>>(`${this.apiUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  getNextInvoiceNumber(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/next-invoice-number`);
  }
}
