import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { QuestionService, Question, PaginationMeta } from '../../services/question.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-all-questions',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './all-questions.component.html'
})
export class AllQuestionsComponent implements OnInit {
    questionService = inject(QuestionService);
    fb = inject(FormBuilder);
    el = inject(ElementRef);

    questions$ = this.questionService.questions$;
    meta$ = this.questionService.meta$;
    loading$ = this.questionService.loading$;

    filterForm: FormGroup;

    // Custom Dropdown States
    difficultyOpen = false;
    categoryOpen = false;

    difficulties = ['All', 'Easy', 'Medium', 'Hard'];
    categories = ['All', 'Arrays', 'Strings', 'Trees', 'Dynamic Programming'];

    constructor() {
        this.filterForm = this.fb.group({
            search: [''],
            difficulty: ['All'],
            category: ['All']
        });
    }

    @HostListener('document:click', ['$event'])
    onClick(event: MouseEvent) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.difficultyOpen = false;
            this.categoryOpen = false;
        }
    }

    selectDifficulty(value: string) {
        this.filterForm.patchValue({ difficulty: value });
        this.difficultyOpen = false;
    }

    selectCategory(value: string) {
        this.filterForm.patchValue({ category: value });
        this.categoryOpen = false;
    }

    ngOnInit(): void {
        // Initial load
        this.loadQuestions();

        // Search/Filter listeners
        this.filterForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
        ).subscribe(() => {
            this.loadQuestions(1); // Reset to page 1 on filter change
        });
    }

    loadQuestions(page: number = 1) {
        const filters = this.filterForm.value;
        this.questionService.loadQuestions(page, 10, filters);
    }

    onPageChange(page: number) {
        this.loadQuestions(page);
    }

    deleteQuestion(id: string) {
        Swal.fire({
            title: 'Delete Question?',
            text: "This action cannot be undone. Are you sure?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444', // Red-500 (Danger)
            cancelButtonColor: '#64748B',  // Slate-500 (Subtle)
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'rounded-[10px] px-4 py-2 text-white font-medium',
                cancelButton: 'rounded-[10px] px-4 py-2 text-white font-medium ml-3'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.questionService.deleteQuestion(id).subscribe({
                    next: () => {
                        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
                    },
                    error: (err) => {
                        Swal.fire('Error', 'Failed to delete question', 'error');
                    }
                });
            }
        });
    }

    formatCount(count: number): string {
        if (!count) return '0';
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    }

    getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'Easy': return 'bg-emerald-100 text-emerald-700';
            case 'Medium': return 'bg-orange-100 text-orange-700';
            case 'Hard': return 'bg-rose-100 text-rose-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    trackByFn(index: number, item: Question) {
        return item._id; // Unique ID for performance
    }

    clearFilters() {
        this.filterForm.patchValue({
            search: '',
            difficulty: 'All',
            category: 'All'
        });
    }

    getPages(totalPages: number, currentPage: number): number[] {
        const pages: number[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first, last, and window around current
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                if (totalPages > 4) pages.push(-1); // Separator
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push(-1);
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push(-1);
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push(-1);
                pages.push(totalPages);
            }
        }
        return pages;
    }
}
