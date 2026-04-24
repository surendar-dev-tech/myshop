import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface ShopProfile {
  id?: number;
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  gstStateCode?: string;
  panNumber?: string;
  website?: string;
  footerMessage?: string;
  termsAndConditions?: string;
  invoiceHeader?: string;
  invoiceFooter?: string;
  showLogo?: boolean;
  logoUrl?: string;
  invoiceTemplate?: string;
  printMode?: string;
  profilePicture?: string; // Base64 encoded image or URL
}

@Injectable({
  providedIn: 'root'
})
export class ShopProfileService {
  private apiUrl = `${environment.apiUrl}/shop-profile`;
  private cachedProfile: ShopProfile | null = null;

  constructor(private http: HttpClient) {}

  getShopProfile(): Observable<ApiResponse<ShopProfile>> {
    return this.http.get<ApiResponse<ShopProfile>>(this.apiUrl);
  }

  getShopProfileCached(): Observable<ShopProfile> {
    return new Observable(observer => {
      if (this.cachedProfile) {
        observer.next(this.cachedProfile);
        observer.complete();
      } else {
        this.getShopProfile().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.cachedProfile = response.data;
              observer.next(this.cachedProfile);
            } else {
              observer.next(this.getDefaultProfile());
            }
            observer.complete();
          },
          error: () => {
            observer.next(this.getDefaultProfile());
            observer.complete();
          }
        });
      }
    });
  }

  saveShopProfile(profile: ShopProfile): Observable<ApiResponse<ShopProfile>> {
    return this.http.post<ApiResponse<ShopProfile>>(this.apiUrl, profile);
  }

  updateShopProfile(profile: ShopProfile): Observable<ApiResponse<ShopProfile>> {
    return this.http.put<ApiResponse<ShopProfile>>(this.apiUrl, profile);
  }

  clearCache(): void {
    this.cachedProfile = null;
  }

  private getDefaultProfile(): ShopProfile {
    return {
      shopName: 'MyShop',
      invoiceTemplate: 'DEFAULT',
      printMode: 'POS',
      showLogo: false
    };
  }
}

