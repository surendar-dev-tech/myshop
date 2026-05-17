import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface SalesReturnItemLine {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface SalesReturnRequest {
  customerId?: number;
  referenceSaleId?: number;
  returnDate?: string;
  items: SalesReturnItemLine[];
  discount?: number;
  notes?: string;
}

export interface SalesReturn {
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
export class SalesReturnService {
  private apiUrl = `${environment.apiUrl}/sales-returns`;

  private listCache: CacheEntry<ApiResponse<SalesReturn[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust the sales-returns list cache. */
  invalidateCache(): void {
    this.listCache = null;
  }

  createSalesReturn(body: SalesReturnRequest): Observable<ApiResponse<SalesReturn>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<SalesReturn>>(this.apiUrl, body);
  }

  getAll(): Observable<ApiResponse<SalesReturn[]>> {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return of(this.listCache.data);
    }
    return this.http.get<ApiResponse<SalesReturn[]>>(this.apiUrl).pipe(
      tap(r => { this.listCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  getById(id: number): Observable<ApiResponse<SalesReturn>> {
    return this.http.get<ApiResponse<SalesReturn>>(`${this.apiUrl}/${id}`);
  }
}
