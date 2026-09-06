export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  studentNumber: string;
  departmentId: string;
  level: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}