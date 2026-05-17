import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface PurchaseReturnItemLine {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface PurchaseReturnRequest {
  supplierId?: number;
  referencePurchaseId?: number;
  returnDate?: string;
  items: PurchaseReturnItemLine[];
  discount?: number;
  notes?: string;
}

export interface PurchaseReturn {
  id: number;
  returnNumber: string;
  returnDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
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
export class PurchaseReturnService {
  private apiUrl = `${environment.apiUrl}/purchase-returns`;

  private listCache: CacheEntry<ApiResponse<PurchaseReturn[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust the purchase-returns list cache. */
  invalidateCache(): void {
    this.listCache = null;
  }

  createPurchaseReturn(body: PurchaseReturnRequest): Observable<ApiResponse<PurchaseReturn>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<PurchaseReturn>>(this.apiUrl, body);
  }

  getAll(): Observable<ApiResponse<PurchaseReturn[]>> {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return of(this.listCache.data);
    }
    return this.http.get<ApiResponse<PurchaseReturn[]>>(this.apiUrl).pipe(
      tap(r => { this.listCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  getById(id: number): Observable<ApiResponse<PurchaseReturn>> {
    return this.http.get<ApiResponse<PurchaseReturn>>(`${this.apiUrl}/${id}`);
  }
}
