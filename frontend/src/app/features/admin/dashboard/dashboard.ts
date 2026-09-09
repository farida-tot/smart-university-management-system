import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';

type AdminEditState = {
  department: string | null;
  instructor: string | null;
  student: string | null;
  course: string | null;
  section: string | null;
};

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
  private statusTimer: any = null;
  editing: AdminEditState = { department: null, instructor: null, student: null, course: null, section: null };

  departmentForm = this.formBuilder.nonNullable.group({ name: ['', Validators.required], code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2,8}$/)]], description: [''] });
  instructorForm = this.formBuilder.nonNullable.group({ name: ['', Validators.required], employeeNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,12}(?:@gov\.nu\.edu)?$/i)]], password: ['', [Validators.required, Validators.minLength(6)]], departmentId: ['', Validators.required] });
  studentForm = this.formBuilder.nonNullable.group({ name: ['', Validators.required], studentNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,15}$/)]], password: ['', [Validators.required, Validators.minLength(6)]], departmentId: ['', Validators.required], level: [1, [Validators.required, Validators.min(1), Validators.max(4)]] });
  courseForm = this.formBuilder.nonNullable.group({ code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2,5}[0-9]{2,4}$/)]], name: ['', Validators.required], description: [''], creditHours: [3, [Validators.required, Validators.min(1)]], departmentId: ['', Validators.required] });
  sectionForm = this.formBuilder.nonNullable.group({ courseId: ['', Validators.required], instructorId: ['', Validators.required], semester: ['Fall 2026', Validators.required], sectionNumber: ['S1', [Validators.required, Validators.pattern(/^S[0-9]{1,3}$/i)]], capacity: [30, [Validators.required, Validators.min(1), Validators.max(500)]], day: ['Sunday', Validators.required], slot: [1, [Validators.required, Validators.min(1), Validators.max(14)]], room: ['', Validators.required] });

  ngOnInit() { this.loadData(); }

  loadData() {
    this.adminService.getOverview().subscribe({ next: data => { this.departments = data.departments; this.instructors = data.instructors; this.courses = data.courses; this.students = data.students; this.sections = data.sections; this.courseRequests = data.courseRequests; this.enrollments = data.enrollments.filter((item: any) => item.status === 'pending'); this.changeDetector.markForCheck(); }, error: error => this.showError(error) });
  }

  private beginEdit(kind: keyof AdminEditState, label: string) {
    this.message = `Editing ${label}. Update the form above and save.`;
    this.error = '';
    this.scheduleStatusClear();
    const formId = `${kind}-form`;
    const formElement = document.getElementById(formId);
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private scheduleStatusClear() {
    if (this.statusTimer) {
      clearTimeout(this.statusTimer);
    }
    this.statusTimer = setTimeout(() => {
      this.message = '';
      this.error = '';
      this.changeDetector.markForCheck();
    }, 1700);
  }

  submit(form: any, request: () => any, kind: keyof AdminEditState) {
    this.message = ''; this.error = '';
    if (form.invalid) {
      form.markAllAsTouched();
      this.error = 'Complete all required fields with valid values before saving.';
      this.changeDetector.markForCheck();
      return;
    }
    this.busy = true;
    request().subscribe({ next: () => { this.message = 'Saved successfully.'; this.busy = false; this.scheduleStatusClear(); form.reset(); this.editing[kind] = null; this.restorePasswordValidation(kind); this.loadData(); }, error: (error: any) => { this.showError(error); this.busy = false; } });
  }

  createDepartment() { const id = this.editing.department; this.submit(this.departmentForm, () => id ? this.adminService.updateDepartment(id, this.departmentForm.getRawValue()) : this.adminService.createDepartment(this.departmentForm.getRawValue()), 'department'); }
  createInstructor() { const id = this.editing.instructor; const value = this.instructorForm.getRawValue(); this.submit(this.instructorForm, () => id ? this.adminService.updateInstructor(id, value) : this.adminService.createInstructor(value), 'instructor'); }
  createStudent() { const id = this.editing.student; const value = this.studentForm.getRawValue(); this.submit(this.studentForm, () => id ? this.adminService.updateStudent(id, value) : this.adminService.createStudent(value), 'student'); }
  createCourse() { const id = this.editing.course; const value = this.courseForm.getRawValue(); this.submit(this.courseForm, () => id ? this.adminService.updateCourse(id, value) : this.adminService.createCourse(value), 'course'); }
  createSection() {
    const value = this.sectionForm.getRawValue();
    const id = this.editing.section;
    this.submit(this.sectionForm, () => id ? this.adminService.updateSection(id, { courseId: value.courseId, instructorId: value.instructorId, semester: value.semester, sectionNumber: value.sectionNumber, capacity: value.capacity, schedule: [{ day: value.day, slot: value.slot, room: value.room }] }) : this.adminService.createSection({ ...value, schedule: [{ day: value.day, slot: value.slot, room: value.room }] }), 'section');
  }

  editDepartment(item: any) { this.editing.department = item._id; this.departmentForm.patchValue({ name: item.name, code: item.code, description: item.description ?? '' }); this.beginEdit('department', 'the department'); }
  editInstructor(item: any) { this.editing.instructor = item._id; this.instructorForm.controls.password.clearValidators(); this.instructorForm.controls.password.updateValueAndValidity(); this.instructorForm.patchValue({ name: item.userId?.name ?? '', employeeNumber: item.employeeNumber, departmentId: item.departmentId?._id ?? item.departmentId }); this.beginEdit('instructor', 'the instructor'); }
  editStudent(item: any) {
    this.editing.student = item._id;
    this.studentForm.controls.password.clearValidators();
    this.studentForm.controls.password.updateValueAndValidity();
    this.studentForm.patchValue({ name: item.userId?.name ?? '', studentNumber: item.studentNumber, departmentId: item.departmentId?._id ?? item.departmentId, level: item.level, password: '' });
    this.message = 'Student loaded for editing. Update the form and click Save student.';
    this.error = '';
    setTimeout(() => {
      const studentNumberInput = document.querySelector('input[formControlName="studentNumber"]');
      studentNumberInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (studentNumberInput as HTMLInputElement | null)?.focus();
    });
  }
  editCourse(item: any) { this.editing.course = item._id; this.courseForm.patchValue({ code: item.code, name: item.name, description: item.description ?? '', creditHours: item.creditHours, departmentId: item.departmentId?._id ?? item.departmentId }); this.beginEdit('course', 'the course'); }
  editSection(item: any) { const schedule = item.schedule?.[0]; this.editing.section = item._id; this.sectionForm.patchValue({ courseId: item.courseId?._id ?? item.courseId, instructorId: item.instructorId?._id ?? item.instructorId, semester: item.semester, sectionNumber: item.sectionNumber, capacity: item.capacity, day: schedule?.day ?? 'Sunday', slot: schedule?.slot ?? 1, room: schedule?.room ?? '' }); this.beginEdit('section', 'the section'); }
  cancelEdit(kind: keyof AdminEditState) { this.editing[kind] = null; this.restorePasswordValidation(kind); }

  private restorePasswordValidation(kind: string) {
    const form = kind === 'student' ? this.studentForm : kind === 'instructor' ? this.instructorForm : null;
    if (form) {
      form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      form.controls.password.updateValueAndValidity();
    }
  }

  remove(kind: string, id: string) {
    if (!window.confirm('Deactivate or delete this record?')) return;
    const requests: Record<string, () => any> = {
      department: () => this.adminService.deleteDepartment(id), instructor: () => this.adminService.deleteInstructor(id),
      student: () => this.adminService.deleteStudent(id), course: () => this.adminService.deleteCourse(id), section: () => this.adminService.deleteSection(id)
    };
    this.busy = true;
    requests[kind]().subscribe({ next: () => { this.message = 'Record removed successfully.'; this.busy = false; this.loadData(); }, error: (error: any) => { this.showError(error); this.busy = false; } });
  }

  reviewCourse(id: string, status: 'approved' | 'rejected') { this.adminService.reviewCourseRequest(id, status).subscribe({ next: () => { this.message = `Course request ${status}.`; this.error = ''; this.loadData(); }, error: error => this.showError(error) }); }
  reviewSection(id: string, status: 'approved' | 'rejected') { this.adminService.reviewEnrollment(id, status).subscribe({ next: () => { this.message = `Enrollment request ${status}.`; this.error = ''; this.loadData(); }, error: error => this.showError(error) }); }

  private showError(error: any) { this.error = error.error?.message ?? 'Unable to complete the request.'; this.scheduleStatusClear(); this.changeDetector.markForCheck(); }
}