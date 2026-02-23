import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submissions.component.html'
})
export class SubmissionsComponent implements OnInit {
  private adminService = inject(AdminService);
  submissions: any[] = [];
  isLoading = false;

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.isLoading = true;
    this.adminService.getSubmissions().subscribe({
      next: (res) => {
        this.submissions = res.data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
