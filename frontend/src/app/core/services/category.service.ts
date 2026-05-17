import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  private listCache: CacheEntry<ApiResponse<Category[]>> | null = null;

  constructor(private httpClient: HttpClient) {}

  /** Bust the categories list cache (called automatically on mutations). */
  invalidateCache(): void {
    this.listCache = null;
  }

  getAllCategories(): Observable<ApiResponse<Category[]>> {
    const now = Date.now();
    if (this.listCache && this.listCache.expiresAt > now) {
      return of(this.listCache.data);
    }
    return this.httpClient.get<ApiResponse<Category[]>>(this.apiUrl).pipe(
      tap(r => { this.listCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.httpClient.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Category): Observable<ApiResponse<Category>> {
    this.invalidateCache();
    return this.httpClient.post<ApiResponse<Category>>(this.apiUrl, category);
  }

  updateCategory(id: number, category: Category): Observable<ApiResponse<Category>> {
    this.invalidateCache();
    return this.httpClient.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    this.invalidateCache();
    return this.httpClient.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
