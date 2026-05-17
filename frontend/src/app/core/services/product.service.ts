import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Product {
  id?: number;
  name: string;
  description?: string;
  barcode: string;
  categoryId?: number;
  categoryName?: string;
  purchasePrice: number;
  sellingPrice: number;
  unit: string;
  hsnCode?: string;
  gstRatePercent?: number;
  active?: boolean;
  currentStock?: number;
  lowStock?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  private activeProductsCache: CacheEntry<ApiResponse<Product[]>> | null = null;
  private allProductsCache: CacheEntry<ApiResponse<Product[]>> | null = null;
  private categoriesCache: CacheEntry<ApiResponse<any[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust all product-related caches (call after create/update/delete). */
  invalidateCache(): void {
    this.activeProductsCache = null;
    this.allProductsCache = null;
  }

  getAllProducts(): Observable<ApiResponse<Product[]>> {
    const now = Date.now();
    if (this.allProductsCache && this.allProductsCache.expiresAt > now) {
      return of(this.allProductsCache.data);
    }
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl).pipe(
      tap(r => { this.allProductsCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  /**
   * Returns only active products, cached for 30 s.
   * This is what list screens should use.
   */
  getActiveProducts(): Observable<ApiResponse<Product[]>> {
    const now = Date.now();
    if (this.activeProductsCache && this.activeProductsCache.expiresAt > now) {
      return of(this.activeProductsCache.data);
    }
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/active`).pipe(
      tap(r => { this.activeProductsCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  searchProducts(query: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  getLowStockProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/low-stock`);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Product): Observable<ApiResponse<Product>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<Product>>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Product): Observable<ApiResponse<Product>> {
    this.invalidateCache();
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    this.invalidateCache();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<ApiResponse<any[]>> {
    const now = Date.now();
    if (this.categoriesCache && this.categoriesCache.expiresAt > now) {
      return of(this.categoriesCache.data);
    }
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/categories`).pipe(
      tap(r => { this.categoriesCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }
}
