import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../../services/question.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-question',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './add-question.component.html'
})
export class AddQuestionComponent implements OnInit {
    fb = inject(FormBuilder);
    questionService = inject(QuestionService);
    router = inject(Router);
    el = inject(ElementRef);

    questionForm: FormGroup;
    isSubmitting = false;
    activeTab: 'manual' | 'excel' = 'manual';

    // Custom Dropdown State
    difficultyOpen = false;
    difficulties = ['Easy', 'Medium', 'Hard'];

    @HostListener('document:click', ['$event'])
    onClick(event: MouseEvent) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.difficultyOpen = false;
        }
    }

    selectDifficulty(value: string) {
        this.questionForm.patchValue({ difficulty: value });
        this.difficultyOpen = false;
    }

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
            referenceSolution: ['', Validators.required],
            isPremium: [false]
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
        return null;
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files ? input.files[0] : null;
        if (!file) return;

        this.isSubmitting = true;
        this.questionService.bulkUploadQuestions(file).subscribe({
            next: (res: any) => {
                this.isSubmitting = false;
                Swal.fire({
                    title: 'Success!',
                    text: `${res.data.count} questions uploaded successfully`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    this.router.navigate(['/admin/questions']);
                });
            },
            error: (err: any) => {
                this.isSubmitting = false;
                if (err.error?.errors) {
                    let errorMessage = 'Mandatory fields are missing in some rows:<br><br>';
                    err.error.errors.forEach((e: any) => {
                        errorMessage += `<b>Row ${e.row}:</b> Missing ${e.missingFields.join(', ')}<br>`;
                    });
                    Swal.fire({
                        icon: 'error',
                        title: 'Validation Failed',
                        html: `<div style="text-align: left; font-size: 14px;">${errorMessage}</div>`,
                        footer: 'Please fix your Excel file and try again.'
                    });
                } else {
                    Swal.fire('Error', err.error?.message || 'Failed to upload questions', 'error');
                }
                input.value = ''; // Reset
            }
        });
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

        this.questionService.createQuestion(payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                Swal.fire({
                    title: 'Success!',
                    text: 'Question added successfully',
                    icon: 'success',
                    timer: 1500,
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
