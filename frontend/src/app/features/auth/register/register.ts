import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  registerForm;
  registrationError = '';
  registrationSuccess = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {

    this.registerForm = this.fb.nonNullable.group({
      name: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email
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

    console.log('Sending:', formData);

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.registrationSuccess = 'Registration successful. You can now log in.';
        this.registerForm.reset({ level: 1 });
      },

      error: (error) => {
        console.error('Registration failed:', error);
        this.registrationError = error.error?.message ??
          'Registration failed. Please try again.';
      }
    });
  }
}