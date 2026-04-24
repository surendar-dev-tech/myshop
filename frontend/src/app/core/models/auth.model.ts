export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  /** New business / company name — creates an isolated tenant */
  companyName: string;
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  username: string;
  role: string;
  companyId?: number;
  companyName?: string;
  /** Customer record id when role is CUSTOMER */
  customerProfileId?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}









