import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InstructorDashboardResponse } from '../models/instructor';

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/instructors';

  getDashboard(): Observable<InstructorDashboardResponse> {
    return this.http.get<InstructorDashboardResponse>(`${this.apiUrl}/me/dashboard`);
  }

  getMyProfile() { return this.http.get<any>(`${this.apiUrl}/me`); }
  updateMyProfile(data: { name?: string; email?: string }) { return this.http.patch(`${this.apiUrl}/me`, data); }

  recordAttendance(sectionId: string, data: { studentId: string; date: string; status: string }) {
    return this.http.put(`${this.apiUrl}/me/sections/${sectionId}/attendance`, data);
  }

  recordCoursework(sectionId: string, studentId: string, courseworkMarks: number, finalExamMarks: number) {
    return this.http.put(`${this.apiUrl}/me/sections/${sectionId}/students/${studentId}/coursework`, { courseworkMarks, finalExamMarks });
  }

  downloadAssignment(id: string): Observable<Blob> {
    return this.http.get(`http://localhost:3000/api/assignments/${id}/download`, { responseType: 'blob' });
  }

  uploadAssignment(courseId: string, title: string, description: string, deadline: string, file: File) {
    const data = new FormData();
    data.append('title', title); data.append('description', description); data.append('deadline', deadline); data.append('file', file);
    return this.http.post(`http://localhost:3000/api/assignments/courses/${courseId}`, data);
  }
}
