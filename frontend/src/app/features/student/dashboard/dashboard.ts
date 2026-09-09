import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Student } from '../../../core/services/student';

@Component({ selector: 'app-student-dashboard', imports: [], templateUrl: './dashboard.html', styleUrl: './dashboard.css' })
export class StudentDashboard implements OnInit {
  private readonly studentService = inject(Student);
  private readonly changeDetector = inject(ChangeDetectorRef);
  dashboard: any;
  error = '';
  message = '';
  readonly scheduleDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  readonly slotNumbers = Array.from({ length: 14 }, (_, index) => index + 1);

  ngOnInit() { this.load(); }
  load() {
    this.error = '';
    this.message = '';
    this.studentService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.dashboard = null;
        this.error = error.name === 'TimeoutError'
          ? 'The university server is taking too long to respond. Please try again in a moment.'
          : error.status === 0
            ? 'Unable to reach the university server. Check that the backend is running.'
            : error.error?.message ?? 'Unable to load your dashboard.';
        this.changeDetector.markForCheck();
      }
    });
  }
  requestCourse(id: string) { this.studentService.requestCourse(id).subscribe({ next: () => { this.message = 'Course request sent to the admin.'; this.load(); }, error: error => this.error = error.error?.message ?? 'Unable to request this course.' }); }
  requestSection(id: string, requestType: 'enrollment' | 'change' = 'enrollment') { this.studentService.requestSection(id, requestType).subscribe({ next: () => { this.message = requestType === 'change' ? 'Section change requested. Awaiting admin approval.' : 'Section request sent to the admin.'; this.load(); }, error: error => this.error = error.error?.message ?? 'Unable to request this section.' }); }
  courseStatus(id: string) { return this.dashboard?.courseRequests?.find((request: any) => request.courseId?._id === id)?.status; }
  enrollmentStatus(id: string) { return this.dashboard?.enrollments?.find((item: any) => item.sectionId?._id === id)?.status ?? null; }
  enrollmentLabel(id: string) {
    const status = this.enrollmentStatus(id);
    return status === 'enrolled' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Requested';
  }
  currentCourseEnrollment(courseId: string) {
    return this.dashboard?.enrollments?.find((item: any) =>
      item.sectionId?.courseId?._id === courseId && ['enrolled', 'completed'].includes(item.status)
    ) ?? null;
  }
  isSectionDisabled(section: any) {
    const currentEnrollment = this.currentCourseEnrollment(section.courseId?._id);
    if (!currentEnrollment) return false;
    return String(currentEnrollment.sectionId?._id) !== String(section._id);
  }
  getSectionInstructor(section: any) {
    return section.instructorId?.userId?.name ?? 'Instructor TBD';
  }
  getScheduleCell(day: string, slotNumber: number) {
    const entries = (this.dashboard?.enrollments ?? [])
      .filter((item: any) => ['enrolled', 'completed'].includes(item.status) && item.sectionId)
      .filter((item: any) => item.sectionId.schedule?.some((entry: any) => entry.day === day && entry.slot === slotNumber))
      .map((item: any) => {
        const schedule = item.sectionId.schedule.find((entry: any) => entry.day === day && entry.slot === slotNumber);
        return `${item.sectionId.courseId?.code ?? 'Course'} ${item.sectionId.sectionNumber ?? ''} · ${schedule?.room ?? ''}`;
      });
    return entries.length ? entries.join(' / ') : '';
  }
}