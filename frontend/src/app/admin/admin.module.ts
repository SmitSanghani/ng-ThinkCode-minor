import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';

// Components
import { AddQuestionComponent } from './components/add-question/add-question.component';
import { ManageQuestionsComponent } from './components/manage-questions/manage-questions.component';
import { EditQuestionComponent } from './components/edit-question/edit-question.component';

@NgModule({
    imports: [
        CommonModule,
        AdminRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        RouterModule,
        AddQuestionComponent,
        ManageQuestionsComponent,
        EditQuestionComponent
    ],
    exports: [
        AddQuestionComponent,
        ManageQuestionsComponent,
        EditQuestionComponent
    ]
})
export class AdminModule { }
