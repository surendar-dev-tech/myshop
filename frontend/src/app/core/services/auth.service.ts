import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, JwtResponse, ApiResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<ApiResponse<JwtResponse>> {
    return this.http.post<ApiResponse<JwtResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<JwtResponse>> {
    const body: RegisterRequest = {
      ...payload,
      email: payload.email?.trim() || undefined
    };
    return this.http.post<ApiResponse<JwtResponse>>(`${this.apiUrl}/register`, body).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  private persistSession(response: ApiResponse<JwtResponse>): void {
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      const user = {
        username: response.data.username,
        role: response.data.role,
        companyId: response.data.companyId,
        companyName: response.data.companyName,
        customerProfileId: response.data.customerProfileId
      };
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}









