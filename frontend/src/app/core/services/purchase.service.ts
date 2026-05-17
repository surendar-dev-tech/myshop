import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface PurchaseItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseRequest {
  supplierId?: number;
  purchaseDate?: string;
  items: PurchaseItem[];
  discount?: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId?: number;
  supplierName?: string;
  purchaseDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  items?: any[];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = `${environment.apiUrl}/purchases`;

  private listCache: CacheEntry<ApiResponse<Purchase[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust purchases list cache (called automatically on create). */
  invalidateCache(): void {
    this.listCache = null;
  }

  createPurchase(purchase: PurchaseRequest): Observable<ApiResponse<Purchase>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<Purchase>>(this.apiUrl, purchase);
  }

  getAllPurchases(): Observable<ApiResponse<Purchase[]>> {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return of(this.listCache.data);
    }
    return this.http.get<ApiResponse<Purchase[]>>(this.apiUrl).pipe(
      tap(r => { this.listCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  getPurchaseById(id: number): Observable<ApiResponse<Purchase>> {
    return this.http.get<ApiResponse<Purchase>>(`${this.apiUrl}/${id}`);
  }

  getPurchasesBySupplier(supplierId: number): Observable<ApiResponse<Purchase[]>> {
    return this.http.get<ApiResponse<Purchase[]>>(`${this.apiUrl}/supplier/${supplierId}`);
  }

  getPurchasesByDateRange(startDate: string, endDate: string): Observable<ApiResponse<Purchase[]>> {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const params = new HttpParams()
      .set('startDate', startDateObj.toISOString())
      .set('endDate', endDateObj.toISOString());
    return this.http.get<ApiResponse<Purchase[]>>(`${this.apiUrl}/date-range`, { params });
  }
}
