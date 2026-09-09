import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../core/services/admin';

@Component({
  selector: 'app-admin-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit {

  private readonly formBuilder = inject(FormBuilder);

  private readonly adminService = inject(AdminService);

  private readonly changeDetector = inject(ChangeDetectorRef);

  departments: any[] = [];

  instructors: any[] = [];

  courses: any[] = [];

  students: any[] = [];

  sections: any[] = [];

  courseRequests: any[] = [];

  enrollments: any[] = [];

  message = '';

  error = '';

  busy = false;

  departmentForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    code: ['', [
      Validators.required,
      Validators.pattern(/^[A-Za-z]{2,8}$/)
    ]]
  });

  instructorForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    employeeNumber: ['', [
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9-]{2,12}$/)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]],
    departmentId: ['', Validators.required]
  });

  studentForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    studentNumber: ['', [
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9-]{3,15}$/)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]],
    departmentId: ['', Validators.required],
    level: [1, [
      Validators.required,
      Validators.min(1),
      Validators.max(4)
    ]]
  });

  courseForm = this.formBuilder.nonNullable.group({
    code: ['', [
      Validators.required,
      Validators.pattern(/^[A-Za-z]{2,5}[0-9]{2,4}$/)
    ]],
    name: ['', Validators.required],
    description: [''],
    creditHours: [3, [
      Validators.required,
      Validators.min(1)
    ]],
    departmentId: ['', Validators.required]
  });

  sectionForm = this.formBuilder.nonNullable.group({
    courseId: ['', Validators.required],
    instructorId: ['', Validators.required],
    semester: ['Fall 2026', Validators.required],
    sectionNumber: ['S1', [
      Validators.required,
      Validators.pattern(/^S[0-9]{1,3}$/i)
    ]],
    capacity: [30, [
      Validators.required,
      Validators.min(1),
      Validators.max(500)
    ]],
    day: ['Sunday', Validators.required],
    slot: [1, [
      Validators.required,
      Validators.min(1),
      Validators.max(14)
    ]],
    room: ['', Validators.required]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {

    this.adminService.getOverview().subscribe({
      next: data => {

        this.departments = data.departments;

        this.instructors = data.instructors;

        this.courses = data.courses;

        this.students = data.students;

        this.sections = data.sections;

        this.courseRequests = data.courseRequests;

        this.enrollments = data.enrollments.filter(
          (item: any) => item.status === 'pending'
        );

        this.changeDetector.markForCheck();
      },

      error: error => this.showError(error)
    });

  }

  submit(form: any, request: () => any) {

    this.message = '';
    this.error = '';

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.busy = true;

    request().subscribe({

      next: () => {

        this.message = 'Saved successfully.';

        this.busy = false;

        form.reset();

        this.loadData();
      },

      error: (error: any) => {

        this.showError(error);

        this.busy = false;
      }

    });

  }

  createDepartment() {
    this.submit(
      this.departmentForm,
      () => this.adminService.createDepartment(
        this.departmentForm.getRawValue()
      )
    );
  }

  createInstructor() {
    this.submit(
      this.instructorForm,
      () => this.adminService.createInstructor(
        this.instructorForm.getRawValue()
      )
    );
  }

  createStudent() {
    this.submit(
      this.studentForm,
      () => this.adminService.createStudent(
        this.studentForm.getRawValue()
      )
    );
  }

  // Delete student
  deleteStudent(id: string) {

    this.message = '';
    this.error = '';

    const confirmed = confirm(
      'Are you sure you want to delete this student?'
    );

    if (!confirmed) {
      return;
    }

    this.busy = true;

    this.adminService.deleteStudent(id).subscribe({

      next: () => {

        this.message = 'Student deleted successfully.';

        this.busy = false;

        this.loadData();
      },

      error: (error: any) => {

        this.showError(error);

        this.busy = false;
      }

    });

  }

  createCourse() {
    this.submit(
      this.courseForm,
      () => this.adminService.createCourse(
        this.courseForm.getRawValue()
      )
    );
  }

  createSection() {

    const value = this.sectionForm.getRawValue();

    this.submit(
      this.sectionForm,
      () => this.adminService.createSection({
        ...value,
        schedule: [
          {
            day: value.day,
            slot: value.slot,
            room: value.room
          }
        ]
      })
    );

  }

  reviewCourse(
    id: string,
    status: 'approved' | 'rejected'
  ) {

    this.adminService.reviewCourseRequest(
      id,
      status
    ).subscribe({

      next: () => this.loadData(),

      error: error => this.showError(error)

    });

  }

  reviewSection(
    id: string,
    status: 'approved' | 'rejected'
  ) {

    this.adminService.reviewEnrollment(
      id,
      status
    ).subscribe({

      next: () => this.loadData(),

      error: error => this.showError(error)

    });

  }

  private showError(error: any) {

    this.error =
      error.error?.message ??
      'Unable to complete the request.';

    this.changeDetector.markForCheck();

  }

}