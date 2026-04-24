import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface StockTransaction {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/stock`;

  constructor(private httpClient: HttpClient) {}

  addStockIn(productId: number, quantity: number, unitPrice?: number, notes?: string): Observable<ApiResponse<StockTransaction>> {
    let params = new HttpParams();
    
    // Ensure quantity is properly formatted
    params = params.set('quantity', quantity.toString());
    
    // Only add unitPrice if it's provided and greater than 0
    if (unitPrice !== undefined && unitPrice !== null && unitPrice > 0) {
      params = params.set('unitPrice', unitPrice.toString());
    }
    
    // Add notes if provided
    if (notes && notes.trim()) {
      params = params.set('notes', notes.trim());
    }
    
    return this.httpClient.post<ApiResponse<StockTransaction>>(
      `${this.apiUrl}/${productId}/in`,
      null,
      { params }
    );
  }

  addStockOut(productId: number, quantity: number, notes?: string): Observable<ApiResponse<StockTransaction>> {
    let params = new HttpParams().set('quantity', quantity.toString());
    
    if (notes) {
      params = params.set('notes', notes);
    }
    
    return this.httpClient.post<ApiResponse<StockTransaction>>(
      `${this.apiUrl}/${productId}/out`,
      null,
      { params }
    );
  }

  getStockHistory(productId: number): Observable<ApiResponse<StockTransaction[]>> {
    return this.httpClient.get<ApiResponse<StockTransaction[]>>(
      `${this.apiUrl}/${productId}/history`
    );
  }

  getCurrentStock(productId: number): Observable<ApiResponse<number>> {
    return this.httpClient.get<ApiResponse<number>>(
      `${this.apiUrl}/${productId}/current`
    );
  }
}

