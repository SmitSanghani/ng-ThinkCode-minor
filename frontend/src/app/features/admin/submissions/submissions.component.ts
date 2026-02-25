import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.css']
})
export class SubmissionsComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  allSubmissions: any[] = [];
  filteredSubmissions: any[] = [];
  paginatedSubmissions: any[] = [];

  // State
  isLoading = false;
  statusFilter = '';
  dateFilter = '';
  sortBy = 'date';

  // View Modal
  selectedSubmission: any = null;
  showViewModal = false;

  // Pagination
  pagination = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  };

  get showingTo(): number {
    return Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalItems);
  }

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.isLoading = true;
    this.adminService.getSubmissions().subscribe({
      next: (res) => {
        this.allSubmissions = res.data || [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  resetFilters() {
    this.statusFilter = '';
    this.dateFilter = '';
    this.sortBy = 'date';
    this.applyFilters();
  }

  applyFilters() {
    let results = [...this.allSubmissions];

    if (this.statusFilter) {
      results = results.filter(s => s.status === this.statusFilter);
    }

    if (this.dateFilter) {
      const selectedDate = new Date(this.dateFilter).toDateString();
      results = results.filter(s => new Date(s.submittedAt).toDateString() === selectedDate);
    }

    // Sort Logic
    if (this.sortBy === 'date') {
      results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (this.sortBy === 'runtime') {
      results.sort((a, b) => (a.runtime || 0) - (b.runtime || 0));
    } else if (this.sortBy === 'status') {
      results.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }

    this.filteredSubmissions = results;
    this.pagination.totalItems = results.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    const endIndex = startIndex + this.pagination.pageSize;
    this.paginatedSubmissions = this.filteredSubmissions.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
    }
  }

  // ── View Modal ────────────────────────────────────────────────────────────
  openView(submission: any) {
    this.selectedSubmission = submission;
    this.showViewModal = true;
    this.cdr.detectChanges();
  }

  closeView() {
    this.showViewModal = false;
    this.selectedSubmission = null;
    this.cdr.detectChanges();
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteSubmission(submission: any) {
    if (!confirm(`Are you sure you want to delete this submission by "${submission.student?.username}"?`)) return;

    this.adminService.deleteSubmission(submission._id).subscribe({
      next: () => {
        this.allSubmissions = this.allSubmissions.filter(s => s._id !== submission._id);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Failed to delete submission: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  // ── Relative Time ─────────────────────────────────────────────────────────
  timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  exportToCSV() {
    if (this.filteredSubmissions.length === 0) return;

    const headers = ['Status', 'Problem', 'Student', 'Runtime', 'Memory', 'Date'];
    const rows = this.filteredSubmissions.map(s => [
      s.status || 'N/A',
      s.question?.title || 'N/A',
      s.student?.username || 'N/A',
      s.runtime ? `${s.runtime}ms` : 'N/A',
      s.memory ? `${s.memory}MB` : 'N/A',
      new Date(s.submittedAt).toLocaleString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submissions_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getStatusClass(status: string) {
    const s = status?.trim().toLowerCase();
    if (s === 'accepted' || s === 'passed') return 'status-accepted';
    if (s === 'wrong answer' || s === 'wa' || s === 'runtime error' || s === 're' ||
      s === 'time limit exceeded' || s === 'tle' || s === 'compilation error' || s === 'failed') {
      return 'status-wa';
    }
    return 'status-pending';
  }
}
