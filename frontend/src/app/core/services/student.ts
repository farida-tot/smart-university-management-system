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

  getDashboard() {
    return this.http.get<any>(`${this.apiUrl}/me/dashboard`).pipe(
      timeout(8000)
    );
  }
  requestCourse(courseId: string) { return this.http.post(`${this.apiUrl}/me/courses/${courseId}/request`, {}); }
  requestSection(sectionId: string) { return this.http.post(`${this.apiUrl}/me/sections/${sectionId}/request`, {}); }
  dropEnrollment(enrollmentId: string) { return this.http.patch(`${this.apiUrl}/me/enrollments/${enrollmentId}/drop`, {}); }
  getAssignments() { return this.http.get<any[]>('http://localhost:3000/api/assignments/student/me'); }
  downloadAssignment(id: string) { return this.http.get(`http://localhost:3000/api/assignments/${id}/download`, { responseType: 'blob' }); }
}
