import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private httpClient: HttpClient) {}

  getAllCategories(): Observable<ApiResponse<Category[]>> {
    return this.httpClient.get<ApiResponse<Category[]>>(this.apiUrl);
  }

  getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.httpClient.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Category): Observable<ApiResponse<Category>> {
    return this.httpClient.post<ApiResponse<Category>>(this.apiUrl, category);
  }

  updateCategory(id: number, category: Category): Observable<ApiResponse<Category>> {
    return this.httpClient.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.httpClient.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}









