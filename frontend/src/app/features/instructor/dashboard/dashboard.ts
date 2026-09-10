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

  saveGrade(section: InstructorSection, studentId: string, attendanceMarks: number | string, courseworkMarks: number | string, finalExamMarks: number | string) {
    const attendance = Number(attendanceMarks);
    const coursework = Number(courseworkMarks);
    const finalExam = Number(finalExamMarks);
    if (attendanceMarks === '' || courseworkMarks === '' || finalExamMarks === '' || !Number.isInteger(attendance) || attendance < 0 || attendance > 10 || !Number.isInteger(coursework) || coursework < 0 || coursework > 30 || !Number.isInteger(finalExam) || finalExam < 0 || finalExam > 60) {
      this.errorMessage = 'Enter attendance from 0-10, coursework from 0-30, and final exam from 0-60.';
      return;
    }
    this.savingKey = `grade-${studentId}`;
    this.instructorService.recordCoursework(section.section._id, studentId, attendance, coursework, finalExam).subscribe({
      next: () => { this.successMessage = 'Marks saved. The final grade updates after all three marks are entered.'; this.savingKey = ''; this.loadDashboard(); },
      error: (error) => { this.errorMessage = error.error?.message ?? 'Unable to save coursework mark.'; this.savingKey = ''; this.changeDetector.markForCheck(); }
    });
  }

  getAttendanceMark(section: InstructorSection, studentId: string) { return section.courseworkGrades.find((grade: any) => grade.studentId === studentId)?.attendanceMarks ?? ''; }
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
