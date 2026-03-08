import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, tap, catchError, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

import type { User } from '../models/user.model';
export type { User };

export interface AuthResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth';

    currentUser: WritableSignal<User | null> = signal<User | null>(null);
    isAuthenticated: WritableSignal<boolean> = signal<boolean>(false);
    isLoading: WritableSignal<boolean> = signal<boolean>(false);

    private authCheckPromise: Promise<boolean> | null = null;

    constructor(private http: HttpClient, private router: Router) {
        // We will call checkSession explicitly in Guards rather than here 
        // because Guards need to wait for it.
    }

    get token(): string | null {
        return sessionStorage.getItem('accessToken');
    }

    // Main hydration method
    checkDetails(): Observable<boolean> {
        if (this.isAuthenticated() && this.token) {
            return of(true);
        }

        const rt = sessionStorage.getItem('refreshToken');
        if (!rt) return of(false);

        // Try to refresh token using sessionStorage stored refresh token
        return this.refreshToken().pipe(
            switchMap(() => this.getMe()),
            map(user => !!user),
            catchError(() => of(false))
        );
    }

    register(data: any): Observable<AuthResponse> {
        this.isLoading.set(true);
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
            tap(response => {
                this.isLoading.set(false);
                if (response.success && response.accessToken && response.refreshToken && response.user) {
                    this.setSession(response.accessToken, response.refreshToken, response.user);
                }
            }),
            catchError(this.handleError)
        );
    }

    login(data: any): Observable<AuthResponse> {
        this.isLoading.set(true);
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
            tap(response => {
                this.isLoading.set(false);
                if (response.success && response.accessToken && response.refreshToken && response.user) {
                    this.setSession(response.accessToken, response.refreshToken, response.user);
                }
            }),
            catchError(this.handleError)
        );
    }

    logout(): void {
        this.http.post(`${this.apiUrl}/logout`, {}).subscribe(() => {
            this.clearSession();
            this.router.navigate(['/login']);
        });
    }

    refreshToken(): Observable<AuthResponse> {
        const refreshToken = sessionStorage.getItem('refreshToken');
        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
            tap(response => {
                if (response.success && response.accessToken && response.refreshToken) {
                    sessionStorage.setItem('accessToken', response.accessToken);
                    sessionStorage.setItem('refreshToken', response.refreshToken);
                }
            })
        );
    }

    getMe(): Observable<User> {
        return this.http.get<any>(`${this.apiUrl}/me`).pipe(
            map(response => {
                if (response.success && response.data) {
                    this.currentUser.set(response.data);
                    this.isAuthenticated.set(true);
                    return response.data;
                }
                throw new Error('No user data');
            }),
            tap({
                error: () => this.clearSession()
            })
        );
    }

    private setSession(accessToken: string, refreshToken: string, user: User): void {
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
    }

    private clearSession(): void {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }

    private handleError(error: HttpErrorResponse) {
        const message = error.error?.message || error.error?.error || 'Server error';
        return throwError(() => new Error(message));
    }
}
