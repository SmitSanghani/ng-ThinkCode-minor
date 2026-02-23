import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-problems-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './problems-list.component.html',
  styleUrls: ['./problems-list.component.css']
})
export class ProblemsListComponent implements OnInit {
  private studentService = inject(StudentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Data Sources
  allProblems: any[] = [];
  filteredProblems: any[] = [];

  // Current Page View Data
  problems: any[] = [];

  // State Management
  searchQuery: string = '';
  selectedDifficulty: string = 'All';
  isLoading: boolean = true;

  // Pagination State
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

  Math = Math;

  ngOnInit() {
    this.loadInitialProblems();
  }

  // Fetch all problems once for client-side filtering for a snappy SaaS feel
  loadInitialProblems() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.studentService.getProblems(1, 1000, {}).subscribe({
      next: (res: any) => {
        console.log('RAW /problems RESPONSE:', res);
        this.allProblems = res.problems || (res.data && res.data.problems) || res.data || [];
        this.filterProblems();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading problems:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Set difficulty filter and trigger filtering
  setDifficulty(diff: string) {
    this.selectedDifficulty = diff;
    this.filterProblems();
  }

  // Main Filtering Logic
  filterProblems() {
    // 1. Start from original problems array (Do not mutate)
    let result = [...this.allProblems];

    // 2. Apply difficulty filter first
    if (this.selectedDifficulty && this.selectedDifficulty !== 'All') {
      result = result.filter(p =>
        p.difficulty.toLowerCase() === this.selectedDifficulty.toLowerCase()
      );
    }

    // 3. Then apply search filter (by title or category wrapper)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // 4. Update filteredProblems state
    this.filteredProblems = result;

    // Reset to first page whenever filters change
    this.pagination.page = 1;
    this.updatePagination();
  }

  // Client-Side Pagination Logic
  updatePagination() {
    this.pagination.total = this.filteredProblems.length;
    this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.limit);

    const startIndex = (this.pagination.page - 1) * this.pagination.limit;
    const endIndex = startIndex + this.pagination.limit;

    // Slice exactly what is needed for the current view
    this.problems = this.filteredProblems.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.pagination.page = page;
    this.updatePagination();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedDifficulty = 'All';
    this.filterProblems();
  }

  viewProblem(id: string) {
    this.router.navigate(['/student/problems', id]);
  }
}
