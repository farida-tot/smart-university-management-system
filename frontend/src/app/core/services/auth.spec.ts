import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saves and clears the session token', () => {
    service.saveSession({
      message: 'Login successful',
      token: 'test-token',
      user: {
        id: 'user-1',
        name: 'Sara Mohamed Ahmed',
        email: '2024001@nu.edu',
        role: 'student'
      }
    });

    expect(service.getToken()).toBe('test-token');
    service.clearSession();
    expect(service.getToken()).toBeNull();
  });
});
