import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
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

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  private usersCache: CacheEntry<ApiResponse<ShopUser[]>> | null = null;

  constructor(private http: HttpClient) {}

  /** Bust the users list cache (called automatically on mutations). */
  invalidateCache(): void {
    this.usersCache = null;
  }

  getUsers(): Observable<ApiResponse<ShopUser[]>> {
    const now = Date.now();
    if (this.usersCache && this.usersCache.expiresAt > now) {
      return of(this.usersCache.data);
    }
    return this.http.get<ApiResponse<ShopUser[]>>(this.apiUrl).pipe(
      tap(r => { this.usersCache = { data: r, expiresAt: Date.now() + CACHE_TTL_MS }; })
    );
  }

  createUser(body: CreateUserRequest): Observable<ApiResponse<ShopUser>> {
    this.invalidateCache();
    return this.http.post<ApiResponse<ShopUser>>(this.apiUrl, body);
  }

  updateUser(id: number, body: UpdateUserRequest): Observable<ApiResponse<ShopUser>> {
    this.invalidateCache();
    return this.http.put<ApiResponse<ShopUser>>(`${this.apiUrl}/${id}`, body);
  }

  setActive(id: number, active: boolean): Observable<ApiResponse<void>> {
    this.invalidateCache();
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/active`, { active });
  }

  resetPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/password`, { newPassword });
  }
}
