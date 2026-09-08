import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Profile } from './features/student/profile/profile';
import { Dashboard } from './features/instructor/dashboard/dashboard';
import { AdminDashboard } from './features/admin/dashboard/dashboard';
import { StudentDashboard } from './features/student/dashboard/dashboard';
import { StudentAssignments } from './features/student/assignments/assignments';
import { About } from './features/home/about';
import { Bylaws } from './features/home/bylaws';
import { Home } from './features/home/home';
import { Departments } from './features/catalog/departments/departments';
import { DepartmentDetail } from './features/catalog/department-detail/department-detail';
import { Settings } from './features/settings/settings';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'bylaws', component: Bylaws },
  { path: 'departments', component: Departments },
  { path: 'departments/:id', component: DepartmentDetail },
  { path: 'settings', component: Settings },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'profile',
    component: Profile
  },
  { path: 'student/dashboard', component: StudentDashboard },
  { path: 'student/assignments', component: StudentAssignments },
  {
    path: 'instructor/dashboard',
    component: Dashboard
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboard
  }
];