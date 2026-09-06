import { Routes } from '@angular/router';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { Profile } from './features/student/profile/profile';
import { Dashboard } from './features/instructor/dashboard/dashboard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'profile',
    component: Profile
  },
  {
    path: 'instructor/dashboard',
    component: Dashboard
  }
];