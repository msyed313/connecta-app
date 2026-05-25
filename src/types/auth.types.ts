export interface RegisterRequest {
  userName : string;
  email    : string;
  password : string;
}

export interface VerifyOtpRequest {
  email   : string;
  otpCode : string;
}

export interface LoginRequest {
  email    : string;
  password : string;
}

export interface AuthResponse {
  accessToken  : string;
  refreshToken : string;
  userId       : string;
  userName     : string;
  email        : string;
}