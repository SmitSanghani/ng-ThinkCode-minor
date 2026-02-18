import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, Question } from '../../services/admin.service';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-manage-questions',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './manage-questions.component.html'
})
export class ManageQuestionsComponent implements OnInit {
    adminService = inject(AdminService);
    fb = inject(FormBuilder);

    questions: Question[] = [];
    pagination: any = {};
    isLoading = false;

    filterForm: FormGroup;

    constructor() {
        this.filterForm = this.fb.group({
            search: [''],
            difficulty: ['All'],
            category: ['All']
        });
    }

    ngOnInit(): void {
        this.loadQuestions();

        // Debounce search input
        this.filterForm.get('search')?.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadQuestions(1);
        });
    }

    loadQuestions(page: number = 1): void {
        this.isLoading = true;
        const filters = this.filterForm.value;

        this.adminService.getAllQuestions(page, 10, filters).subscribe({
            next: (res) => {
                if (res.success) {
                    this.questions = res.data.questions;
                    this.pagination = res.data.pagination;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        this.loadQuestions(1);
    }

    resetFilters(): void {
        this.filterForm.patchValue({
            search: '',
            difficulty: 'All',
            category: 'All'
        });
        this.loadQuestions(1);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.pagination.totalPages) {
            this.loadQuestions(page);
        }
    }

    deleteQuestion(id: string): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this question!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                this.adminService.deleteQuestion(id).subscribe({
                    next: () => {
                        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
                        this.loadQuestions(this.pagination.page);
                    },
                    error: () => {
                        Swal.fire('Error', 'Failed to delete question', 'error');
                    }
                });
            }
        });
    }

    // Helper for difficulty badge color
    getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}
