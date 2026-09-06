import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpTesting: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as unknown as typeof router;
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the API for an invalid form', () => {
    component.onSubmit();

    expect(component.loginForm.touched).toBe(true);
    httpTesting.expectNone('http://localhost:3000/api/auth/login');
  });

  it('saves the token and navigates to the profile after a successful login', () => {
    component.loginForm.setValue({
      email: '2024001@nu.edu',
      password: 'password123'
    });

    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      message: 'Login successful',
      token: 'test-token',
      user: {
        id: 'user-1',
        name: 'Sara Mohamed Ahmed',
        email: '2024001@nu.edu',
        role: 'student'
      }
    });

    expect(localStorage.getItem('smart-university-token')).toBe('test-token');
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('displays the API error when login fails', () => {
    component.loginForm.setValue({
      email: '2024001@nu.edu',
      password: 'wrong-password'
    });

    component.onSubmit();
    httpTesting.expectOne('http://localhost:3000/api/auth/login').flush(
      { message: 'Invalid email or password' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.loginError).toBe('Invalid email or password');
    expect(component.isSubmitting).toBe(false);
  });

  it('stops loading and displays a timeout error when the API does not respond', fakeAsync(() => {
    component.loginForm.setValue({
      email: 'missing@university.edu',
      password: 'password123'
    });

    component.onSubmit();
    httpTesting.expectOne('http://localhost:3000/api/auth/login');
    tick(8001);

    expect(component.loginError).toBe(
      'The university server is taking too long to respond. Try again in a moment.'
    );
    expect(component.isSubmitting).toBe(false);
  }));
});
