import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:3000/api';

  getDepartments() { return this.http.get<any[]>(`${this.api}/departments`); }
  getInstructors() { return this.http.get<any[]>(`${this.api}/instructors`); }
  getCourses() { return this.http.get<any[]>(`${this.api}/courses`); }
  getOverview() { return this.http.get<any>(`${this.api}/admin/overview`); }
  reviewCourseRequest(id: string, status: 'approved' | 'rejected') { return this.http.patch(`${this.api}/admin/course-requests/${id}`, { status }); }
  reviewEnrollment(id: string, status: 'approved' | 'rejected') { return this.http.patch(`${this.api}/admin/enrollments/${id}`, { status }); }

  createDepartment(data: { name: string; code: string }) { return this.http.post(`${this.api}/departments`, data); }
  createInstructor(data: { name: string; employeeNumber: string; password: string; departmentId: string }) {
    return this.http.post(`${this.api}/auth/instructors`, data);
  }
  createStudent(data: { name: string; password: string; studentNumber: string; departmentId: string; level: number }) {
    return this.http.post(`${this.api}/auth/students`, data);
  }
  createCourse(data: { code: string; name: string; description: string; creditHours: number; departmentId: string }) {
    return this.http.post(`${this.api}/courses`, { ...data, prerequisites: [] });
  }
  createSection(data: unknown) { return this.http.post(`${this.api}/sections`, data); }
}