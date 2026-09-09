import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { StudentDashboard } from './dashboard';

describe('StudentDashboard', () => {
  let component: StudentDashboard;
  let fixture: ComponentFixture<StudentDashboard>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentDashboard);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows an error message when the dashboard request fails', () => {
    fixture.detectChanges();

    httpTesting.expectOne('http://localhost:3000/api/students/me/dashboard').flush(
      { message: 'Unable to load your dashboard.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    fixture.detectChanges();

    expect(component.error).toBe('Unable to load your dashboard.');
    expect(fixture.nativeElement.textContent).toContain('Unable to load your dashboard.');
  });
});
