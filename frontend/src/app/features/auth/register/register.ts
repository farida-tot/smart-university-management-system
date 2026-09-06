import { ChangeDetectorRef, Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  registerForm;
  registrationError = '';
  registrationSuccess = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {

    this.registerForm = this.fb.nonNullable.group({
      name: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[A-Za-z0-9]+@nu\.edu$/)
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],

      studentNumber: ['', Validators.required],

      departmentId: ['', Validators.required],

      level: [1, [
        Validators.required,
        Validators.min(1),
        Validators.max(4)
      ]]
    });

  }

  onSubmit() {

    this.registrationError = '';
    this.registrationSuccess = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = this.registerForm.getRawValue();

    if (formData.email.split('@')[0].toLowerCase() !== formData.studentNumber.trim().toLowerCase()) {
      this.registerForm.controls.email.setErrors({ studentEmailMismatch: true });
      this.registerForm.controls.email.markAsTouched();
      this.registrationError = 'College email must match the student number, for example 2024001@nu.edu.';
      return;
    }

    this.isSubmitting = true;

    console.log('Sending:', formData);

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.registrationSuccess = 'Registration successful. You can now log in.';
        this.isSubmitting = false;
        this.registerForm.reset({ level: 1 });
        this.changeDetector.markForCheck();
      },

      error: (error) => {
        console.error('Registration failed:', error);
        this.isSubmitting = false;
        this.registrationError = error.error?.message ??
          'Registration failed. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }
}