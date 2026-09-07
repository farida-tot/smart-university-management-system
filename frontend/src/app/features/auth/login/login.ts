import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[A-Za-z0-9]+@(stud\.nu\.edu|gov\.nu\.edu)$/)]],
    password: ['', Validators.required]
  });
  loginError = '';
  isSubmitting = false;
  private loginTimeoutId: ReturnType<typeof setTimeout> | undefined;

  onSubmit() {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.loginTimeoutId = setTimeout(() => {
      if (this.isSubmitting) {
        this.loginError = 'The university server is taking too long to respond. Try again in a moment.';
        this.isSubmitting = false;
        this.changeDetector.markForCheck();
      }
    }, 8000);

    this.authService.login(this.loginForm.getRawValue()).pipe(
      finalize(() => {
        this.clearLoginTimeout();
        this.isSubmitting = false;
        this.changeDetector.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        this.authService.saveSession(response);
        const destination = response.user.role === 'student'
          ? '/'
          : response.user.role === 'admin'
          ? '/admin/dashboard'
          : response.user.role === 'instructor'
            ? '/instructor/dashboard'
            : '/student/dashboard';
        this.router.navigate([destination]);
      },
      error: (error) => {
        this.loginError = error.name === 'TimeoutError'
          ? 'The university server is taking too long to respond. Try again in a moment.'
          : error.status === 0
            ? 'Unable to reach the university server. Check that the backend is running.'
            : error.error?.message ?? 'Login failed. Please try again.';
          this.changeDetector.markForCheck();
      }
    });
  }

  private clearLoginTimeout() {
    if (this.loginTimeoutId !== undefined) {
      clearTimeout(this.loginTimeoutId);
      this.loginTimeoutId = undefined;
    }
  }
}
