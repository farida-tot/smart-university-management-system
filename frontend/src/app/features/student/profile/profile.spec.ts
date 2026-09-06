import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('http://localhost:3000/api/students/me').flush({
      user: {
        id: 'user-1',
        name: 'Amina Hassan',
        email: 'amina@university.edu',
        role: 'student'
      },
      student: {
        id: 'student-1',
        studentNumber: '2024001',
        level: 1,
        department: {
          _id: 'department-1',
          name: 'Computer Science',
          code: 'CS'
        }
      }
    });
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads and displays user and student data', () => {
    expect(component.user?.name).toBe('Amina Hassan');
    expect(component.user?.email).toBe('amina@university.edu');
    expect(component.student?.studentNumber).toBe('2024001');
    expect(component.student?.department.name).toBe('Computer Science');
    expect(component.student?.level).toBe(1);
    expect(component.profileForm.getRawValue()).toEqual({
      name: 'Amina Hassan',
      email: 'amina@university.edu'
    });
    expect(component.isLoading).toBe(false);
  });

  it('updates the user after a successful profile update', () => {
    component.profileForm.setValue({
      name: 'Amina Hassan Updated',
      email: 'amina.updated@university.edu'
    });

    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/students/me');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      name: 'Amina Hassan Updated',
      email: 'amina.updated@university.edu'
    });
    request.flush({
      message: 'Profile updated successfully',
      user: {
        id: 'user-1',
        name: 'Amina Hassan Updated',
        email: 'amina.updated@university.edu',
        role: 'student'
      }
    });

    expect(component.user?.name).toBe('Amina Hassan Updated');
    expect(component.user?.email).toBe('amina.updated@university.edu');
    expect(component.successMessage).toBe('Profile updated successfully');
    expect(component.isSaving).toBe(false);
  });

  it('displays the API error when a profile update fails', () => {
    component.onSubmit();

    httpTesting.expectOne('http://localhost:3000/api/students/me').flush(
      { message: 'Email already exists' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isSaving).toBe(false);
  });
});
