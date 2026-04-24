import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface CustomerProductPriceDto {
  id?: number;
  customerId: number;
  productId: number;
  productName: string;
  unitPrice: number;
}

export interface UpsertCustomerProductPriceRequest {
  customerId: number;
  productId: number;
  unitPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerProductPriceService {
  private apiUrl = `${environment.apiUrl}/customer-product-prices`;

  constructor(private http: HttpClient) {}

  listByCustomer(customerId: number): Observable<ApiResponse<CustomerProductPriceDto[]>> {
    return this.http.get<ApiResponse<CustomerProductPriceDto[]>>(
      `${this.apiUrl}/by-customer/${customerId}`
    );
  }

  upsert(body: UpsertCustomerProductPriceRequest): Observable<ApiResponse<CustomerProductPriceDto>> {
    return this.http.post<ApiResponse<CustomerProductPriceDto>>(this.apiUrl, body);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  deleteByCustomerAndProduct(
    customerId: number,
    productId: number
  ): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/by-customer/${customerId}/product/${productId}`
    );
  }
}
