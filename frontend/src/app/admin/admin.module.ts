import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';

// Components
import { AddQuestionComponent } from './components/add-question/add-question.component';
import { AllQuestionsComponent } from './components/all-questions/all-questions.component';
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
        AllQuestionsComponent,
        EditQuestionComponent
    ],
    exports: [
        AddQuestionComponent,
        AllQuestionsComponent,
        EditQuestionComponent
    ]
})
export class AdminModule { }
