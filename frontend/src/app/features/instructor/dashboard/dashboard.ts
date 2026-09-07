import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorSection } from '../../../core/models/instructor';
import { InstructorService } from '../../../core/services/instructor';

@Component({
  selector: 'app-instructor-dashboard',
  imports: [FormsModule, DatePipe],
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
  assignmentTitle = '';
  assignmentDescription = '';
  assignmentDeadline = '';
  assignmentFile: File | null = null;

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

  saveGrade(section: InstructorSection, studentId: string, courseworkMarks: number | string, finalExamMarks: number | string) {
    const coursework = Number(courseworkMarks);
    const finalExam = Number(finalExamMarks);
    if (!Number.isInteger(coursework) || coursework < 1 || coursework > 40 || !Number.isInteger(finalExam) || finalExam < 1 || finalExam > 60) return;
    this.savingKey = `grade-${studentId}`;
    this.instructorService.recordCoursework(section.section._id, studentId, coursework, finalExam).subscribe({
      next: () => { this.successMessage = 'Coursework mark saved.'; this.savingKey = ''; this.loadDashboard(); },
      error: (error) => { this.errorMessage = error.error?.message ?? 'Unable to save coursework mark.'; this.savingKey = ''; this.changeDetector.markForCheck(); }
    });
  }

  getCoursework(section: InstructorSection, studentId: string) { return section.courseworkGrades.find((grade: any) => grade.studentId === studentId)?.courseworkMarks ?? ''; }
  getFinalExam(section: InstructorSection, studentId: string) { return section.courseworkGrades.find((grade: any) => grade.studentId === studentId)?.finalExamMarks ?? ''; }

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

  selectAssignmentFile(event: Event) { this.assignmentFile = (event.target as HTMLInputElement).files?.[0] ?? null; }
  uploadAssignment(section: InstructorSection) {
    if (!this.assignmentTitle || !this.assignmentFile) return;
    this.instructorService.uploadAssignment(section.section.courseId._id, this.assignmentTitle, this.assignmentDescription, this.assignmentDeadline, this.assignmentFile).subscribe({
      next: () => { this.successMessage = 'Assignment uploaded.'; this.assignmentTitle = ''; this.assignmentDescription = ''; this.assignmentDeadline = ''; this.assignmentFile = null; this.loadDashboard(); },
      error: error => { this.errorMessage = error.error?.message ?? 'Unable to upload assignment.'; this.changeDetector.markForCheck(); }
    });
  }
}
