import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './add-question.component.html'
})
export class AddQuestionComponent implements OnInit {
    fb = inject(FormBuilder);
    adminService = inject(AdminService);
    router = inject(Router);

    questionForm: FormGroup;
    isSubmitting = false;

    constructor() {
        this.questionForm = this.fb.group({
            title: ['', Validators.required],
            difficulty: ['Easy', Validators.required],
            category: ['', Validators.required],
            description: ['', Validators.required],
            examples: this.fb.array([]),
            constraints: [''],
            testCases: this.fb.array([], Validators.required),
            functionSignature: ['', Validators.required],
            referenceSolution: ['']
        });
    }

    ngOnInit(): void {
        this.addExample();
        this.addTestCase();
    }

    get examples() {
        return this.questionForm.get('examples') as FormArray;
    }

    get testCases() {
        return this.questionForm.get('testCases') as FormArray;
    }

    addExample() {
        const exampleGroup = this.fb.group({
            input: ['', Validators.required],
            output: ['', Validators.required],
            explanation: ['']
        });
        this.examples.push(exampleGroup);
    }

    removeExample(index: number) {
        this.examples.removeAt(index);
    }

    addTestCase() {
        const testCaseGroup = this.fb.group({
            input: ['', Validators.required],
            expectedOutput: ['', Validators.required],
            isSample: [false]
        });
        this.testCases.push(testCaseGroup);
    }

    removeTestCase(index: number) {
        this.testCases.removeAt(index);
    }

    minTestCasesValidator(control: AbstractControl) {
        if (control instanceof FormArray) {
            if (control.length < 3) {
                return { minTestCases: true };
            }
            const hasSample = control.controls.some(c => c.value.isSample === true);
            if (!hasSample) {
                return { noSample: true };
            }
        }
        return null;
    }

    onSubmit() {
        if (this.questionForm.invalid) {
            this.questionForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formData = this.questionForm.value;

        const processedTestCases = formData.testCases.map((tc: any) => {
            let inputObj;
            try {
                inputObj = JSON.parse(tc.input);
            } catch (e) {
                inputObj = tc.input;
            }
            return { ...tc, input: inputObj };
        });

        const payload = { ...formData, testCases: processedTestCases };

        this.adminService.addQuestion(payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                Swal.fire({
                    title: 'Success!',
                    text: 'Question added successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    this.router.navigate(['/admin/questions']);
                });
            },
            error: (err) => {
                this.isSubmitting = false;
                Swal.fire('Error', err.error?.message || 'Failed to add question', 'error');
            }
        });
    }
}
