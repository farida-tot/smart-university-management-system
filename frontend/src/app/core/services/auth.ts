import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/auth';

  register(data: any) {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: any) {
    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );
  }
}