import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface PurchaseReturnItemLine {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface PurchaseReturnRequest {
  supplierId?: number;
  referencePurchaseId?: number;
  returnDate?: string;
  items: PurchaseReturnItemLine[];
  discount?: number;
  notes?: string;
}

export interface PurchaseReturn {
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
export class PurchaseReturnService {
  private apiUrl = `${environment.apiUrl}/purchase-returns`;

  constructor(private http: HttpClient) {}

  createPurchaseReturn(body: PurchaseReturnRequest): Observable<ApiResponse<PurchaseReturn>> {
    return this.http.post<ApiResponse<PurchaseReturn>>(this.apiUrl, body);
  }

  getAll(): Observable<ApiResponse<PurchaseReturn[]>> {
    return this.http.get<ApiResponse<PurchaseReturn[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<PurchaseReturn>> {
    return this.http.get<ApiResponse<PurchaseReturn>>(`${this.apiUrl}/${id}`);
  }
}
