import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
    selector: 'app-admin-user-submissions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-user-submissions.component.html',
    styleUrls: ['./admin-user-submissions.component.css']
})
export class AdminUserSubmissionsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private adminService = inject(AdminService);

    userId: string = '';
    submissions: any[] = [];
    loading = true;
    error: string | null = null;

    // States for Answer Popup
    selectedSubmission: any | null = null;
    showAnswerModal = false;

    // Helper for line numbers (to avoid compiler issues with hacky template calls)
    lineNumbers: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

    ngOnInit() {
        this.userId = this.route.snapshot.paramMap.get('id') || '';
        if (this.userId) {
            this.loadSubmissions();
        } else {
            this.error = 'No User ID provided';
        }
    }

    loadSubmissions() {
        this.loading = true;
        this.adminService.getUserSubmissions(this.userId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.submissions = res.data;
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load submissions';
                this.loading = false;
            }
        });
    }

    openAnswerPopup(id: string) {
        this.loading = true;
        this.adminService.getSubmissionDetail(id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.selectedSubmission = res.data;
                    this.showAnswerModal = true;
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load submission details';
                this.loading = false;
            }
        });
    }

    closeAnswerPopup() {
        this.showAnswerModal = false;
        this.selectedSubmission = null;
    }

    goBack() {
        this.router.navigate(['/admin/users']);
    }
}
