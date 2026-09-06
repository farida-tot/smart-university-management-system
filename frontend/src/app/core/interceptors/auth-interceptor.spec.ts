import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('leaves the request unchanged when there is no token', () => {
    localStorage.removeItem('smart-university-token');
    const request = new HttpRequest('GET', '/api/students/me');
    const next = vi.fn((nextRequest) => nextRequest);

    interceptor(request, next);

    expect(next).toHaveBeenCalledWith(request);
    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  });

  it('adds the bearer token to the Authorization header', () => {
    localStorage.setItem('smart-university-token', 'test-token');
    const request = new HttpRequest('GET', '/api/students/me');
    const next = vi.fn((nextRequest) => nextRequest);

    interceptor(request, next);

    const forwardedRequest = next.mock.calls[0][0];
    expect(forwardedRequest).not.toBe(request);
    expect(forwardedRequest.headers.get('Authorization')).toBe('Bearer test-token');
  });
});
