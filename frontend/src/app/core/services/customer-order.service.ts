import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface CustomerOrderItemDto {
  id?: number;
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrderDto {
  id: number;
  orderNumber: string;
  paymentMode: string;
  status: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  seenByCompany: boolean;
  convertedSaleId?: number;
  customerId?: number;
  customerName?: string;
  placedByUsername?: string;
  createdAt?: string;
  items?: CustomerOrderItemDto[];
}

export interface PlaceCustomerOrderRequest {
  items: { productId: number; quantity: number }[];
  discount: number;
  paymentMode: 'CASH' | 'CREDIT';
}

export interface SaleDto {
  id?: number;
  invoiceNumber?: string;
  finalAmount?: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const UNSEEN_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class CustomerOrderService {
  private base = `${environment.apiUrl}`;

  private unseenCountCache: CacheEntry<ApiResponse<number>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust the unseen-count cache (call after markSeen / convertToSale). */
  invalidateUnseenCache(): void {
    this.unseenCountCache = null;
  }

  getUnseenCount(): Observable<ApiResponse<number>> {
    const now = Date.now();
    if (this.unseenCountCache && this.unseenCountCache.expiresAt > now) {
      return of(this.unseenCountCache.data);
    }
    return this.http.get<ApiResponse<number>>(`${this.base}/customer-orders/unseen-count`).pipe(
      tap(r => { this.unseenCountCache = { data: r, expiresAt: Date.now() + UNSEEN_TTL_MS }; })
    );
  }

  listOrders(): Observable<ApiResponse<CustomerOrderDto[]>> {
    return this.http.get<ApiResponse<CustomerOrderDto[]>>(`${this.base}/customer-orders`);
  }

  getOrder(id: number): Observable<ApiResponse<CustomerOrderDto>> {
    return this.http.get<ApiResponse<CustomerOrderDto>>(`${this.base}/customer-orders/${id}`);
  }

  markSeen(id: number): Observable<ApiResponse<void>> {
    this.invalidateUnseenCache();
    return this.http.patch<ApiResponse<void>>(`${this.base}/customer-orders/${id}/seen`, {});
  }

  convertToSale(id: number): Observable<ApiResponse<SaleDto>> {
    this.invalidateUnseenCache();
    return this.http.post<ApiResponse<SaleDto>>(`${this.base}/customer-orders/${id}/convert-to-sale`, {});
  }

  placeOrder(body: PlaceCustomerOrderRequest): Observable<ApiResponse<CustomerOrderDto>> {
    return this.http.post<ApiResponse<CustomerOrderDto>>(`${this.base}/portal/orders`, body);
  }
}
