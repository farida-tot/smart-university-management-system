import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthUser } from '../../../core/models/auth';
import { StudentProfile } from '../../../core/models/student';
import { Student } from '../../../core/services/student';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studentService = inject(Student);
  private readonly changeDetector = inject(ChangeDetectorRef);

  profileForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });
  user: AuthUser | null = null;
  student: StudentProfile | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getMyProfile().subscribe({
      next: (response) => {
        this.user = response.user;
        this.student = response.student;
        this.profileForm.setValue({
          name: response.user.name,
          email: response.user.email
        });
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

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.studentService.updateMyProfile(this.profileForm.getRawValue()).subscribe({
      next: (response) => {
        this.user = response.user;
        this.successMessage = response.message;
        this.isSaving = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to update your profile.';
        this.isSaving = false;
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
