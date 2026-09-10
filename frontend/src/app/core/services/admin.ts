import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:3000/api';

  getDepartments() {
    return this.http.get<any[]>(`${this.api}/departments`);
  }

  getInstructors() {
    return this.http.get<any[]>(`${this.api}/instructors`);
  }

  getCourses() {
    return this.http.get<any[]>(`${this.api}/courses`);
  }

  getOverview() {
    return this.http.get<any>(`${this.api}/admin/overview`);
  }

  reviewCourseRequest(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    return this.http.patch(
      `${this.api}/admin/course-requests/${id}`,
      { status }
    );
  }

  reviewEnrollment(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    return this.http.patch(
      `${this.api}/admin/enrollments/${id}`,
      { status }
    );
  }

  createDepartment(data: {
    name: string;
    code: string;
    description: string;
  }) {
    return this.http.post(
      `${this.api}/departments`,
      data
    );
  }

  updateDepartment(
    id: string,
    data: {
      name: string;
      code: string;
      description: string;
    }
  ) {
    return this.http.put(
      `${this.api}/departments/${id}`,
      data
    );
  }

  deleteDepartment(id: string) {
    return this.http.delete(
      `${this.api}/departments/${id}`
    );
  }

  createInstructor(data: {
    name: string;
    employeeNumber: string;
    password: string;
    departmentId: string;
  }) {
    return this.http.post(
      `${this.api}/auth/instructors`,
      data
    );
  }

  updateInstructor(
    id: string,
    data: {
      name: string;
      employeeNumber: string;
      departmentId: string;
    }
  ) {
    return this.http.put(
      `${this.api}/instructors/${id}`,
      data
    );
  }

  deleteInstructor(id: string) {
    return this.http.delete(
      `${this.api}/instructors/${id}`
    );
  }

  createStudent(data: {
    name: string;
    password: string;
    studentNumber: string;
    departmentId: string;
    level: number;
  }) {
    return this.http.post(
      `${this.api}/auth/students`,
      data
    );
  }

  updateStudent(
    id: string,
    data: {
      name: string;
      studentNumber: string;
      departmentId: string;
      level: number;
    }
  ) {
    return this.http.put(
      `${this.api}/admin/students/${id}`,
      data
    );
  }

  deleteStudent(id: string) {
    return this.http.delete(
      `${this.api}/admin/students/${id}`
    );
  }

  createCourse(data: {
    code: string;
    name: string;
    description: string;
    creditHours: number;
    departmentId: string;
  }) {
    return this.http.post(
      `${this.api}/courses`,
      {
        ...data,
        prerequisites: []
      }
    );
  }

  updateCourse(
    id: string,
    data: {
      code: string;
      name: string;
      description: string;
      creditHours: number;
      departmentId: string;
    }
  ) {
    return this.http.put(
      `${this.api}/courses/${id}`,
      data
    );
  }

  deleteCourse(id: string) {
    return this.http.delete(
      `${this.api}/courses/${id}`
    );
  }

  createSection(data: unknown) {
    return this.http.post(
      `${this.api}/sections`,
      data
    );
  }

  updateSection(id: string, data: unknown) {
    return this.http.put(
      `${this.api}/sections/${id}`,
      data
    );
  }

  deleteSection(id: string) {
    return this.http.delete(
      `${this.api}/sections/${id}`
    );
  }
}