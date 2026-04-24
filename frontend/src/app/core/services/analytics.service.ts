import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private httpClient: HttpClient) {}

  getDashboardAnalytics(): Observable<ApiResponse<any>> {
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  getSalesTrend(days: number = 30): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('days', days.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/sales-trend`, { params });
  }

  getTopProducts(limit: number = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/top-products`, { params });
  }

  getTopCustomers(limit: number = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/top-customers`, { params });
  }

  getProfitLossReport(startDate?: Date, endDate?: Date): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/profit-loss`, { params });
  }
}









