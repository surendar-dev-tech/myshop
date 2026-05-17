import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Supplier {
  id?: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  active?: boolean;
}

/** Cache entry shape */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/suppliers`;

  /** Short-lived cache for the active-suppliers list */
  private activeSuppliersCache: CacheEntry<ApiResponse<Supplier[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Invalidate the active-suppliers cache (call after create/update/delete). */
  invalidateCache(): void {
    this.activeSuppliersCache = null;
  }

  getAllSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(this.apiUrl);
  }

  /**
   * Returns only active suppliers.
   * Results are cached for 30 s; call invalidateCache() to bust it early.
   */
  getActiveSuppliers(): Observable<ApiResponse<Supplier[]>> {
    const now = Date.now();
    if (this.activeSuppliersCache && this.activeSuppliersCache.expiresAt > now) {
      return of(this.activeSuppliersCache.data);
    }
    return this.http.get<ApiResponse<Supplier[]>>(`${this.apiUrl}/active`).pipe(
      tap(response => {
        this.activeSuppliersCache = { data: response, expiresAt: Date.now() + CACHE_TTL_MS };
      })
    );
  }

  getSupplierById(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: Supplier): Observable<ApiResponse<Supplier>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<Supplier>>(this.apiUrl, supplier);
  }

  updateSupplier(id: number, supplier: Supplier): Observable<ApiResponse<Supplier>> {
    this.invalidateCache();
    return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<void>> {
    this.invalidateCache();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
