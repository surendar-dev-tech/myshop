import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

/** Cache entry shape */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
  outstandingBalance?: number;
  /** Set by API when listing — shop staff creates portal logins */
  onlineOrderingEnabled?: boolean;
  portalUsername?: string;
}

export interface CreateCustomerPortalRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  /** Short-lived cache for the active-customers list */
  private activeCustomersCache: CacheEntry<ApiResponse<Customer[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Invalidate the active-customers cache (called automatically on mutations). */
  invalidateCache(): void {
    this.activeCustomersCache = null;
  }

  getAllCustomers(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl);
  }

  /**
   * Returns only active customers.
   * Results are cached for 30 s; call invalidateCache() to bust it early.
   */
  getActiveCustomers(): Observable<ApiResponse<Customer[]>> {
    const now = Date.now();
    if (this.activeCustomersCache && this.activeCustomersCache.expiresAt > now) {
      return of(this.activeCustomersCache.data);
    }
    return this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/active`).pipe(
      tap(response => {
        this.activeCustomersCache = { data: response, expiresAt: Date.now() + CACHE_TTL_MS };
      })
    );
  }

  getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<ApiResponse<Customer>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, customer);
  }

  updateCustomer(id: number, customer: Customer): Observable<ApiResponse<Customer>> {
    this.invalidateCache();
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<ApiResponse<void>> {
    this.invalidateCache();
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getCustomerBalance(id: number): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/${id}/balance`);
  }

  createPortalAccount(
    customerId: number,
    body: CreateCustomerPortalRequest
  ): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${customerId}/portal-account`, body);
  }

  revokePortalAccount(customerId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${customerId}/portal-account`);
  }

  resetPortalPassword(customerId: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${customerId}/portal-account/password`, {
      newPassword
    });
  }
}

