import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Supplier {
  id?: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getAllSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(this.apiUrl);
  }

  getSupplierById(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(this.apiUrl, supplier);
  }

  updateSupplier(id: number, supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}









