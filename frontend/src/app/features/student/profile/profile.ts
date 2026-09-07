import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthUser } from '../../../core/models/auth';
import { StudentProfile } from '../../../core/models/student';
import { Student } from '../../../core/services/student';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly studentService = inject(Student);
  private readonly changeDetector = inject(ChangeDetectorRef);

  user: AuthUser | null = null;
  student: StudentProfile | null = null;
  dashboard: any = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.loadProfile();
    this.studentService.getDashboard().subscribe({ next: dashboard => { this.dashboard = dashboard; this.changeDetector.markForCheck(); } });
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getMyProfile().subscribe({
      next: (response) => {
        this.user = response.user;
        this.student = response.student;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.name === 'TimeoutError'
          ? 'The university server is taking too long to respond. Start the backend and try again.'
          : error.error?.message ?? 'Unable to load your profile.';
        this.isLoading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  get initials() {
    return this.user?.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() ?? 'ST';
  }
}
