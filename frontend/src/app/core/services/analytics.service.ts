import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/** Dashboard analytics change slowly — cache for 60 s. */
const DASHBOARD_TTL_MS = 60_000;
/** Trend / top-N can be slightly stale — cache for 60 s. */
const TREND_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  private dashboardCache: CacheEntry<ApiResponse<any>> | null = null;
  private trendCache = new Map<number, CacheEntry<ApiResponse<any>>>();
  private topProductsCache = new Map<number, CacheEntry<ApiResponse<any>>>();
  private topCustomersCache = new Map<number, CacheEntry<ApiResponse<any>>>();

  constructor(private httpClient: HttpClient) {}

  /** Bust all analytics caches (call on manual Refresh). */
  invalidateCache(): void {
    this.dashboardCache = null;
    this.trendCache.clear();
    this.topProductsCache.clear();
    this.topCustomersCache.clear();
  }

  getDashboardAnalytics(): Observable<ApiResponse<any>> {
    const now = Date.now();
    if (this.dashboardCache && this.dashboardCache.expiresAt > now) {
      return of(this.dashboardCache.data);
    }
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`).pipe(
      tap(r => { this.dashboardCache = { data: r, expiresAt: Date.now() + DASHBOARD_TTL_MS }; })
    );
  }

  getSalesTrend(days: number = 30): Observable<ApiResponse<any>> {
    const now = Date.now();
    const cached = this.trendCache.get(days);
    if (cached && cached.expiresAt > now) {
      return of(cached.data);
    }
    const params = new HttpParams().set('days', days.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/sales-trend`, { params }).pipe(
      tap(r => { this.trendCache.set(days, { data: r, expiresAt: Date.now() + TREND_TTL_MS }); })
    );
  }

  getTopProducts(limit: number = 10): Observable<ApiResponse<any>> {
    const now = Date.now();
    const cached = this.topProductsCache.get(limit);
    if (cached && cached.expiresAt > now) {
      return of(cached.data);
    }
    const params = new HttpParams().set('limit', limit.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/top-products`, { params }).pipe(
      tap(r => { this.topProductsCache.set(limit, { data: r, expiresAt: Date.now() + TREND_TTL_MS }); })
    );
  }

  getTopCustomers(limit: number = 10): Observable<ApiResponse<any>> {
    const now = Date.now();
    const cached = this.topCustomersCache.get(limit);
    if (cached && cached.expiresAt > now) {
      return of(cached.data);
    }
    const params = new HttpParams().set('limit', limit.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/top-customers`, { params }).pipe(
      tap(r => { this.topCustomersCache.set(limit, { data: r, expiresAt: Date.now() + TREND_TTL_MS }); })
    );
  }

  getProfitLossReport(startDate?: Date, endDate?: Date): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    // Profit/loss uses custom date ranges — not cached (always fresh).
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/profit-loss`, { params });
  }
}
