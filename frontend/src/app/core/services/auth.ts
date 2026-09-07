import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/auth';
  readonly currentUser = signal<LoginResponse['user'] | null>(this.readUser());

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      timeout(8000)
    );
  }

  saveSession(response: LoginResponse) {
    localStorage.setItem('smart-university-token', response.token);
    localStorage.setItem('smart-university-user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  getToken() {
    return localStorage.getItem('smart-university-token');
  }

  clearSession() {
    localStorage.removeItem('smart-university-token');
    localStorage.removeItem('smart-university-user');
    this.currentUser.set(null);
  }

  private readUser(): LoginResponse['user'] | null {
    const storedUser = localStorage.getItem('smart-university-user');
    if (!storedUser) return null;
    try { return JSON.parse(storedUser); } catch { return null; }
  }
}