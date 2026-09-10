import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:3000/api';

  getDepartments() { return this.http.get<any[]>(`${this.api}/departments`); }
  getDepartment(id: string) { return this.http.get<any>(`${this.api}/departments/${id}`); }
  getCourse(id: string) { return this.http.get<any>(`${this.api}/courses/${id}`); }
  searchCourses(search: string, departmentId?: string) {
    const params: Record<string, string> = { search };
    if (departmentId) params['departmentId'] = departmentId;
    return this.http.get<any[]>(`${this.api}/courses/search`, { params });
  }
  getCourseAssignments(courseId: string) { return this.http.get<any[]>(`${this.api}/assignments/courses/${courseId}`); }
}
