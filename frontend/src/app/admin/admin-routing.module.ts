import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddQuestionComponent } from './components/add-question/add-question.component';
import { ManageQuestionsComponent } from './components/manage-questions/manage-questions.component';
import { EditQuestionComponent } from './components/edit-question/edit-question.component';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        children: [
            { path: 'questions', component: ManageQuestionsComponent, canActivate: [AdminGuard] },
            { path: 'questions/add', component: AddQuestionComponent, canActivate: [AdminGuard] },
            { path: 'questions/edit/:id', component: EditQuestionComponent, canActivate: [AdminGuard] }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
