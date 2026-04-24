import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Product {
  id?: number;
  name: string;
  description?: string;
  barcode: string;
  categoryId?: number;
  categoryName?: string;
  purchasePrice: number;
  sellingPrice: number;
  unit: string;
  hsnCode?: string;
  gstRatePercent?: number;
  active?: boolean;
  currentStock?: number;
  lowStock?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl);
  }

  getActiveProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/active`);
  }

  getLowStockProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/low-stock`);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Product): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Product): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/categories`);
  }
}

