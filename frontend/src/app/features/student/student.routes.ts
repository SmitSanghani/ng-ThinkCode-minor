import { Routes } from '@angular/router';
import { ProblemsListComponent } from './problems-list/problems-list.component';
import { ProblemDetailComponent } from './problem-detail/problem-detail.component';

export const STUDENT_ROUTES: Routes = [
    { path: 'problems', component: ProblemsListComponent },
    { path: 'problems/:id', component: ProblemDetailComponent },
    { path: '', redirectTo: 'problems', pathMatch: 'full' }
];
