import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-edit-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './edit-question.component.html'
})
export class EditQuestionComponent implements OnInit {
    fb = inject(FormBuilder);
    adminService = inject(AdminService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    questionForm: FormGroup;
    isSubmitting = false;
    isLoading = true;
    questionId: string | null = null;

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
        this.questionId = this.route.snapshot.paramMap.get('id');
        if (this.questionId) {
            this.loadQuestion(this.questionId);
        } else {
            this.router.navigate(['/admin/questions']);
        }
    }

    loadQuestion(id: string) {
        this.adminService.getQuestionById(id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.populateForm(res.data);
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'Failed to load question details', 'error').then(() => {
                    this.router.navigate(['/admin/questions']);
                });
            }
        });
    }

    populateForm(data: any) {
        this.questionForm.patchValue({
            title: data.title,
            difficulty: data.difficulty,
            category: data.category,
            description: data.description,
            constraints: data.constraints,
            functionSignature: data.functionSignature,
            referenceSolution: data.referenceSolution
        });

        if (data.examples && data.examples.length) {
            data.examples.forEach((ex: any) => {
                this.addExample(ex);
            });
        }

        if (data.testCases && data.testCases.length) {
            data.testCases.forEach((tc: any) => {
                const inputStr = typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input;
                this.addTestCase({ ...tc, input: inputStr });
            });
        }
    }

    get examples() { return this.questionForm.get('examples') as FormArray; }
    get testCases() { return this.questionForm.get('testCases') as FormArray; }

    addExample(data?: any) {
        const group = this.fb.group({
            input: [data?.input || '', Validators.required],
            output: [data?.output || '', Validators.required],
            explanation: [data?.explanation || '']
        });
        this.examples.push(group);
    }

    removeExample(index: number) { this.examples.removeAt(index); }

    addTestCase(data?: any) {
        const group = this.fb.group({
            input: [data?.input || '', Validators.required],
            expectedOutput: [data?.expectedOutput || '', Validators.required],
            isSample: [data?.isSample || false]
        });
        this.testCases.push(group);
    }

    removeTestCase(index: number) { this.testCases.removeAt(index); }

    minTestCasesValidator(control: AbstractControl) {
        if (control instanceof FormArray) {
            if (control.length < 3) return { minTestCases: true };
            const hasSample = control.controls.some(c => c.value.isSample === true);
            if (!hasSample) return { noSample: true };
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

        this.adminService.updateQuestion(this.questionId!, payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                Swal.fire({
                    title: 'Success!',
                    text: 'Question updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    this.router.navigate(['/admin/questions']);
                });
            },
            error: (err) => {
                this.isSubmitting = false;
                Swal.fire('Error', err.error?.message || 'Failed to update question', 'error');
            }
        });
    }
}
