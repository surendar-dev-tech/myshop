import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

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

  constructor(private http: HttpClient) {}

  getAllCustomers(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl);
  }

  getActiveCustomers(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/active`);
  }

  getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, customer);
  }

  updateCustomer(id: number, customer: Customer): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<ApiResponse<void>> {
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

