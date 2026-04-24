import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface ShopUser {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  phone: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email?: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<ApiResponse<ShopUser[]>> {
    return this.http.get<ApiResponse<ShopUser[]>>(this.apiUrl);
  }

  createUser(body: CreateUserRequest): Observable<ApiResponse<ShopUser>> {
    return this.http.post<ApiResponse<ShopUser>>(this.apiUrl, body);
  }

  updateUser(id: number, body: UpdateUserRequest): Observable<ApiResponse<ShopUser>> {
    return this.http.put<ApiResponse<ShopUser>>(`${this.apiUrl}/${id}`, body);
  }

  setActive(id: number, active: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/active`, { active });
  }

  resetPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/password`, { newPassword });
  }
}
