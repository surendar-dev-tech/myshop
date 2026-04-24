import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface PurchaseItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseRequest {
  supplierId?: number;
  purchaseDate?: string;
  items: PurchaseItem[];
  discount?: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId?: number;
  supplierName?: string;
  purchaseDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  items?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = `${environment.apiUrl}/purchases`;

  constructor(private http: HttpClient) {}

  createPurchase(purchase: PurchaseRequest): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(this.apiUrl, purchase);
  }

  getAllPurchases(): Observable<ApiResponse<Purchase[]>> {
    return this.http.get<ApiResponse<Purchase[]>>(this.apiUrl);
  }

  getPurchaseById(id: number): Observable<ApiResponse<Purchase>> {
    return this.http.get<ApiResponse<Purchase>>(`${this.apiUrl}/${id}`);
  }

  getPurchasesBySupplier(supplierId: number): Observable<ApiResponse<Purchase[]>> {
    return this.http.get<ApiResponse<Purchase[]>>(`${this.apiUrl}/supplier/${supplierId}`);
  }

  getPurchasesByDateRange(startDate: string, endDate: string): Observable<ApiResponse<Purchase[]>> {
    // Convert dates to ISO format for backend
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    
    const params = new HttpParams()
      .set('startDate', startDateObj.toISOString())
      .set('endDate', endDateObj.toISOString());
    return this.http.get<ApiResponse<Purchase[]>>(`${this.apiUrl}/date-range`, { params });
  }
}

