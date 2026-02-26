import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminUserService, AdminUser } from '../../../../core/services/admin-user.service';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private adminUserService = inject(AdminUserService);

    user: AdminUser | null = null;
    loading = true;
    error: string | null = null;

    ngOnInit() {
        const userId = this.route.snapshot.paramMap.get('id');
        if (userId) {
            this.loadUserDetails(userId);
        } else {
            this.error = 'No User ID provided';
            this.loading = false;
        }
    }

    loadUserDetails(userId: string) {
        this.loading = true;
        // Assuming there is a getById or similar in the service
        // If not, we can adjust based on available methods
        this.adminUserService.getUsers(1, 1, '', userId).subscribe({
            next: (res) => {
                if (res.success && res.data.users.length > 0) {
                    this.user = res.data.users[0];
                } else {
                    this.error = 'User not found';
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load user details';
                this.loading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/admin/users']);
    }
}
