import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminUserService, AdminUser } from '../../../core/services/admin-user.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { SocketService } from '../../../core/services/socket.service';
import { ChatStateService } from '../../../core/services/chat-state.service';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-users.component.html',
    styleUrls: ['./admin-users.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent implements OnInit, OnDestroy {
    private adminUserService = inject(AdminUserService);
    private socketService = inject(SocketService);
    public chatService = inject(ChatStateService);
    private router = inject(Router);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    // Data State
    users: AdminUser[] = [];
    totalUsers = 0;
    currentPage = 1;
    totalPages = 1;
    pageSize = 5;

    // Filters
    searchTerm = '';
    statusFilter = '';
    isCreatingInterview: string | null = null;

    // Service Observables
    loading$ = this.adminUserService.loading$;
    error$ = this.adminUserService.error$;

    ngOnInit(): void {
        this.loadUsers();

        // Listen for Realtime Status Updates
        this.socketService.onlineStatus$.pipe(takeUntil(this.destroy$)).subscribe(update => {
            if (!update) return;
            const user = this.users.find(u => u._id === update.userId);
            if (user) {
                user.isOnline = update.isOnline;
                this.cdr.markForCheck();
            }
        });

        // Debounced Search
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.searchTerm = term;
            this.currentPage = 1;
            this.loadUsers();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUsers(): void {
        this.adminUserService.getUsers(
            this.currentPage,
            this.pageSize,
            this.statusFilter,
            this.searchTerm
        ).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.users = res.data.users;
                    this.totalUsers = res.data.totalUsers;
                    this.totalPages = res.data.totalPages;
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onSearchChange(event: any): void {
        this.searchSubject.next(event.target.value);
    }

    onStatusChange(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    navigateToSubmissions(userId: string): void {
        this.router.navigate(['/admin/users', userId, 'submissions']);
    }

    viewUser(userId: string): void {
        this.router.navigate(['/admin/users', userId]);
    }

    openDirectChat(user: AdminUser): void {
        this.chatService.toggleChat({
            id: user._id,
            name: user.name || user.username || 'User'
        });
    }

    startInterview(user: AdminUser): void {
        if (!user || this.isCreatingInterview) return;
        this.isCreatingInterview = user._id;
        this.cdr.markForCheck();

        this.http.post<any>(`${environment.apiUrl}/interview/create`, { candidateId: user._id }).subscribe({
            next: (res) => {
                this.isCreatingInterview = null;
                this.cdr.markForCheck();

                // Show a quick success toast rather than a blocking dialog if navigating
                Swal.fire({
                    title: 'Interview Ready!',
                    text: `Invite sent to ${user.name}. Entering the room now...`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Auto-open chat with this user (for record/future)
                this.openDirectChat(user);

                // REDIRECT ADMIN IMMEDIATELY
                if (res.link) {
                    this.router.navigateByUrl(res.link);
                }
            },
            error: (err) => {
                this.isCreatingInterview = null;
                this.cdr.markForCheck();
                Swal.fire('Error', err.error?.message || 'Failed to create interview', 'error');
            }
        });
    }


    getInitials(user: any): string {
        const displayName = user.name || user.username || user.email;
        if (!displayName) return '??';
        return displayName.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    trackByUserId(index: number, user: AdminUser): string {
        return user._id;
    }
}
