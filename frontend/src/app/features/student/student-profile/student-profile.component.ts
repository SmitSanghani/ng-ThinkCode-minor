import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
    selector: 'app-student-profile',
    standalone: true,
    imports: [CommonModule, RouterLink, NavbarComponent, FormsModule],
    templateUrl: './student-profile.component.html',
    styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    isLoading = true;
    profileData: any = null;

    // Password change fields
    passwordModel = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };
    isChangingPassword = false;
    passwordError = '';
    passwordSuccess = '';

    get user() { return this.profileData?.user; }
    get stats() { return this.profileData?.stats; }
    get questions() { return this.profileData?.solvedQuestions || []; }

    get gradeLabels(): string[] {
        return this.stats ? Object.keys(this.stats.gradeDistribution) : [];
    }

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.isLoading = true;
        this.http.get<any>(`${environment.apiUrl}/student/profile`).subscribe({
            next: (res: any) => {
                if (res.success && res.data) {
                    this.profileData = res.data;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } else {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => {
                console.error('Profile load error:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    changePassword() {
        this.passwordError = '';
        this.passwordSuccess = '';

        if (!this.passwordModel.currentPassword || !this.passwordModel.newPassword || !this.passwordModel.confirmPassword) {
            this.passwordError = 'All fields are required';
            return;
        }

        if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
            this.passwordError = 'Passwords do not match';
            return;
        }

        this.isChangingPassword = true;
        this.http.post<any>(`${environment.apiUrl}/auth/change-password`, this.passwordModel).subscribe({
            next: (res: any) => {
                this.isChangingPassword = false;
                this.passwordSuccess = 'Password updated successfully';
                this.passwordModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.isChangingPassword = false;
                this.passwordError = err.error?.message || 'Failed to update password';
                this.cdr.detectChanges();
            }
        });
    }

    getGradeClass(grade: string): string {
        switch (grade) {
            case 'A': return 'grade-a';
            case 'B': return 'grade-b';
            case 'C': return 'grade-c';
            case 'D': return 'grade-d';
            case 'E': return 'grade-e';
            default: return 'grade-pending';
        }
    }

    getDiffClass(diff: string): string {
        switch (diff) {
            case 'Easy': return 'diff-easy';
            case 'Medium': return 'diff-medium';
            case 'Hard': return 'diff-hard';
            default: return '';
        }
    }

    getPlanBadgeClass(): string {
        return this.user?.plan === 'Premium' ? 'plan-premium' : 'plan-free';
    }
}
