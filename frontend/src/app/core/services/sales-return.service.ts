import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class SalesReturnService {
  private apiUrl = `${environment.apiUrl}/sales-returns`;

  constructor(private http: HttpClient) {}

  createSalesReturn(body: SalesReturnRequest): Observable<ApiResponse<SalesReturn>> {
    return this.http.post<ApiResponse<SalesReturn>>(this.apiUrl, body);
  }

  getAll(): Observable<ApiResponse<SalesReturn[]>> {
    return this.http.get<ApiResponse<SalesReturn[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<SalesReturn>> {
    return this.http.get<ApiResponse<SalesReturn>>(`${this.apiUrl}/${id}`);
  }
}
