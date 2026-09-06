import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/auth';

  register(data: RegisterRequest) {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      timeout(8000)
    );
  }

  saveSession(response: LoginResponse) {
    localStorage.setItem('smart-university-token', response.token);
  }

  getToken() {
    return localStorage.getItem('smart-university-token');
  }

  clearSession() {
    localStorage.removeItem('smart-university-token');
  }
}