import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    submissionCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdminUserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/admin/users`;

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    private errorSubject = new BehaviorSubject<string | null>(null);
    public error$ = this.errorSubject.asObservable();

    getUsers(page: number = 1, limit: number = 10, status: string = '', search: string = ''): Observable<any> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        const params: any = { page, limit };
        if (status) params.status = status;
        if (search) params.search = search;

        return this.http.get<any>(this.apiUrl, { params }).pipe(
            finalize(() => this.loadingSubject.next(false))
        );
    }
}
