import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Student } from '../../../core/services/student';

@Component({ selector: 'app-student-assignments', imports: [DatePipe], templateUrl: './assignments.html', styleUrl: './assignments.css' })
export class StudentAssignments implements OnInit {
  private readonly service = inject(Student);
  private readonly changeDetector = inject(ChangeDetectorRef);
  assignments: any[] = [];
  error = '';
  ngOnInit() { this.service.getAssignments().subscribe({ next: data => { this.assignments = data; this.changeDetector.markForCheck(); }, error: error => { this.error = error.error?.message ?? 'Unable to load assignments.'; this.changeDetector.markForCheck(); } }); }
  download(id: string, name: string) {
    this.error = '';
    this.service.downloadAssignment(id).subscribe({
      next: (file) => {
        const blob = file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name || 'assignment.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (error) => {
        this.error = error.error?.message ?? 'Unable to download assignment.';
        this.changeDetector.markForCheck();
      }
    });
  }
}