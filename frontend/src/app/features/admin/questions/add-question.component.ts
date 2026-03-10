import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-question.component.html'
})
export class AddQuestionComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);

  questionForm: FormGroup;
  isLoading = false;

  constructor() {
    this.questionForm = this.fb.group({
      title: ['', Validators.required],
      difficulty: ['easy', Validators.required],
      category: ['Arrays', Validators.required],
      description: ['', Validators.required],
      testCases: this.fb.array([this.createTestCaseGroup()]),
      referenceSolution: [''],
      estimatedTime: [15],
      isPremium: [false]
    });
  }

  get testCases() { return this.questionForm.get('testCases') as FormArray; }

  createTestCaseGroup(): FormGroup {
    return this.fb.group({
      input: ['', Validators.required],
      expectedOutput: ['', Validators.required],
      isHidden: [false]
    });
  }

  addTestCase() {
    this.testCases.push(this.createTestCaseGroup());
  }

  removeTestCase(index: number) {
    this.testCases.removeAt(index);
  }

  onSubmit() {
    if (this.questionForm.invalid) return;

    this.isLoading = true;
    this.adminService.createQuestion(this.questionForm.value).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Question Created!',
          text: 'The question has been added to the library.',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/admin/questions']);
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Error', err.message || 'Failed to create question', 'error');
      }
    });
  }
}
