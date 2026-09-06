import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import {
  ProfileUpdateResponse,
  StudentProfileResponse
} from '../models/student';

@Injectable({
  providedIn: 'root',
})
export class Student {
  private readonly apiUrl = 'http://localhost:3000/api/students';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<StudentProfileResponse> {
    return this.http.get<StudentProfileResponse>(`${this.apiUrl}/me`).pipe(
      timeout(8000)
    );
  }

  updateMyProfile(data: { name: string; email: string }): Observable<ProfileUpdateResponse> {
    return this.http.patch<ProfileUpdateResponse>(`${this.apiUrl}/me`, data);
  }
}
