import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { AdminOverviewComponent } from './features/admin/overview/overview.component';
import { SubmissionsComponent } from './features/admin/submissions/submissions.component';
import { StudentHomeComponent } from './features/student/home/home.component';
import { ProblemsListComponent } from './features/student/problems-list/problems-list.component';
import { ProblemDetailComponent } from './features/student/problem-detail/problem-detail.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { UserDetailsComponent } from './features/admin/users/user-details/user-details.component';
import { AdminUserSubmissionsComponent } from './features/admin/users/admin-user-submissions/admin-user-submissions.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'website/home', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: AdminOverviewComponent },
            {
                path: '',
                loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
            },
            { path: 'submissions', component: SubmissionsComponent },
            { path: 'users', component: AdminUsersComponent },
            { path: 'users/:id', component: UserDetailsComponent },
            { path: 'users/:id/submissions', component: AdminUserSubmissionsComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    {
        path: 'website/home',
        component: StudentHomeComponent
    },
    {
        path: 'interview/:roomId',
        canActivate: [authGuard],
        loadComponent: () => import('./features/interview/interview.component').then(m => m.InterviewComponent)
    },
    {
        path: 'student',
        canActivate: [authGuard],
        children: [
            { path: 'plans', loadComponent: () => import('./features/student/plans/plans.component').then(m => m.PlansComponent) },
            { path: 'profile', loadComponent: () => import('./features/student/student-profile/student-profile.component').then(m => m.StudentProfileComponent) },
            { path: 'problems', component: ProblemsListComponent },
            { path: 'favorites', component: ProblemsListComponent },
            { path: 'problems/:id', component: ProblemDetailComponent },
            { path: '', redirectTo: 'problems', pathMatch: 'full' }
        ]
    }
];
