import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InstructorSection } from '../../../core/models/instructor';
import { InstructorService } from '../../../core/services/instructor';

@Component({
  selector: 'app-instructor-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly instructorService = inject(InstructorService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  dashboard: any = null;
  activeSection: InstructorSection | null = null;
  loading = true;
  errorMessage = '';
  savingKey = '';
  successMessage = '';

  ngOnInit() { this.loadDashboard(); }

  loadDashboard() {
    this.loading = true;
    this.errorMessage = '';
    this.instructorService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.activeSection = dashboard.sections[0] ?? null;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load the instructor dashboard.';
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  selectSection(section: InstructorSection) { this.activeSection = section; this.successMessage = ''; }

  getGrade(section: InstructorSection, studentId: string) {
    return section.courseworkGrades.find((grade) => grade.studentId === studentId)?.marks ?? null;
  }

  getAttendance(section: InstructorSection, studentId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return section.attendance.find((record) => record.studentId === studentId && record.date.slice(0, 10) === today)?.status ?? '';
  }

  saveAttendance(section: InstructorSection, studentId: string, status: string) {
    if (!status) return;
    this.savingKey = `attendance-${studentId}`;
    this.instructorService.recordAttendance(section.section._id, { studentId, date: new Date().toISOString(), status }).subscribe({
      next: () => { this.successMessage = 'Attendance saved.'; this.savingKey = ''; this.loadDashboard(); },
      error: (error) => { this.errorMessage = error.error?.message ?? 'Unable to save attendance.'; this.savingKey = ''; this.changeDetector.markForCheck(); }
    });
  }

  saveGrade(section: InstructorSection, studentId: string, marks: number | string) {
    const value = Number(marks);
    if (!Number.isFinite(value) || value < 0 || value > 40) return;
    this.savingKey = `grade-${studentId}`;
    this.instructorService.recordCoursework(section.section._id, studentId, value).subscribe({
      next: () => { this.successMessage = 'Coursework mark saved.'; this.savingKey = ''; this.loadDashboard(); },
      error: (error) => { this.errorMessage = error.error?.message ?? 'Unable to save coursework mark.'; this.savingKey = ''; this.changeDetector.markForCheck(); }
    });
  }

  assignmentUrl(id: string) { return `http://localhost:3000/api/assignments/${id}/download`; }

  downloadAssignment(id: string, fileName: string) {
    this.instructorService.downloadAssignment(id).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to download assignment.';
        this.changeDetector.markForCheck();
      }
    });
  }
}
