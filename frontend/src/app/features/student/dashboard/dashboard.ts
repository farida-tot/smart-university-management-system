import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Student } from '../../../core/services/student';

@Component({ selector: 'app-student-dashboard', imports: [], templateUrl: './dashboard.html', styleUrl: './dashboard.css' })
export class StudentDashboard implements OnInit {
  private readonly studentService = inject(Student);
  private readonly changeDetector = inject(ChangeDetectorRef);
  dashboard: any;
  error = '';
  message = '';

  ngOnInit() { this.load(); }
  load() { this.studentService.getDashboard().subscribe({ next: data => { this.dashboard = data; this.changeDetector.markForCheck(); }, error: error => { this.error = error.error?.message ?? 'Unable to load your dashboard.'; this.changeDetector.markForCheck(); } }); }
  requestCourse(id: string) { this.studentService.requestCourse(id).subscribe({ next: () => { this.message = 'Course request sent to the admin.'; this.load(); }, error: error => this.error = error.error?.message ?? 'Unable to request this course.' }); }
  requestSection(id: string) { this.studentService.requestSection(id).subscribe({ next: () => { this.message = 'Section request sent to the admin.'; this.load(); }, error: error => this.error = error.error?.message ?? 'Unable to request this section.' }); }
  courseStatus(id: string) { return this.dashboard?.courseRequests?.find((request: any) => request.courseId?._id === id)?.status; }
  enrollmentStatus(id: string) { return this.dashboard?.enrollments?.find((item: any) => item.sectionId?._id === id)?.status ?? null; }
  enrollmentLabel(id: string) {
    const status = this.enrollmentStatus(id);
    return status === 'enrolled' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Requested';
  }
}