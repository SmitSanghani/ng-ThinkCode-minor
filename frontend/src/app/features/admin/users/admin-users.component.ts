import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminUserService, AdminUser } from '../../../core/services/admin-user.service';
import { SocketService } from '../../../core/services/socket.service';

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
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    // Data State
    users: AdminUser[] = [];
    totalUsers = 0;
    currentPage = 1;
    totalPages = 1;
    pageSize = 10;

    // Filters
    searchTerm = '';
    statusFilter = '';

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

    getInitials(user: any): string {
        const displayName = user.name || user.username || user.email;
        if (!displayName) return '??';
        return displayName.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    trackByUserId(index: number, user: AdminUser): string {
        return user._id;
    }
}
