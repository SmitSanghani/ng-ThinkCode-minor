import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CalendarComponent } from '../../../shared/components/calendar/calendar.component';

@Component({
  selector: 'app-problems-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, CalendarComponent, RouterLink],
  templateUrl: './problems-list.component.html',
  styleUrls: ['./problems-list.component.css']
})
export class ProblemsListComponent implements OnInit {
  private studentService = inject(StudentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  // Data Sources
  allProblems: any[] = [];
  filteredProblems: any[] = [];
  favoriteIds: Set<string> = new Set();

  // Current Page View Data
  problems: any[] = [];

  // State Management
  searchQuery: string = '';
  selectedDifficulty: string = 'All';
  isLoading: boolean = true;
  isFavoritesOnly: boolean = false;

  // Pagination State
  pagination = { total: 0, page: 1, limit: 12, totalPages: 0 };

  Math = Math;

  ngOnInit() {
    this.favoriteIds = new Set(this.studentService.getFavoriteIds());

    // Cleanly detect path changes to switch between All/Favorites
    this.route.url.subscribe(url => {
      const path = url.length > 0 ? url[0].path : '';
      this.isFavoritesOnly = path === 'favorites';

      // Auto-reset filters when switching tabs for a fresh experience
      this.searchQuery = '';
      this.selectedDifficulty = 'All';

      this.loadInitialProblems();
    });
  }

  loadInitialProblems() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.studentService.getProblems(1, 1000, {}).subscribe({
      next: (res: any) => {
        // Robust mapping of API response to avoid empty lists
        this.allProblems = res.problems ||
          (res.data && res.data.problems) ||
          (Array.isArray(res.data) ? res.data : []) ||
          [];
        this.filterProblems();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading problems:', err);
        this.isLoading = false;
        this.allProblems = [];
        this.filterProblems();
        this.cdr.detectChanges();
      }
    });
  }

  setDifficulty(diff: string) {
    this.selectedDifficulty = diff;
    this.filterProblems();
  }

  filterProblems() {
    let result = [...this.allProblems];

    // 1. Step: Favorites filter
    if (this.isFavoritesOnly) {
      result = result.filter(p => this.favoriteIds.has(p._id || p.id));
    }

    // 2. Step: Difficulty filter (safe property check)
    if (this.selectedDifficulty && this.selectedDifficulty !== 'All') {
      result = result.filter(p => {
        const d = (p.difficulty || '').toLowerCase();
        return d === this.selectedDifficulty.toLowerCase();
      });
    }

    // 3. Step: Search filter
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    this.filteredProblems = result;
    this.pagination.page = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination() {
    this.pagination.total = this.filteredProblems.length;
    this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.limit);
    const startIndex = (this.pagination.page - 1) * this.pagination.limit;
    const endIndex = startIndex + this.pagination.limit;
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

  toggleFavorite(id: string, event: Event) {
    event.stopPropagation();
    this.studentService.toggleFavorite(id);
    if (this.favoriteIds.has(id)) {
      this.favoriteIds.delete(id);
      // If we are in favorites view, remove it instantly from the list
      if (this.isFavoritesOnly) {
        this.filterProblems();
      }
    } else {
      this.favoriteIds.add(id);
    }
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds.has(id);
  }

  viewProblem(id: string) {
    this.router.navigate(['/student/problems', id]);
  }
}
