import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

export interface Question {
    _id?: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    examples: any[];
    constraints?: string;
    testCases: any[];
    functionSignature: string;
    referenceSolution?: string;
    totalSubmissions?: number;
    totalAccepted?: number;
    successRate?: number;
    isPremium?: boolean;
    createdAt?: Date;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QuestionsResponse {
    success: boolean;
    data: {
        questions: Question[];
        pagination: PaginationMeta;
    };
}

@Injectable({
    providedIn: 'root'
})
export class QuestionService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/admin/questions`;

    // State
    private _questions = new BehaviorSubject<Question[]>([]);
    private _meta = new BehaviorSubject<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
    private _loading = new BehaviorSubject<boolean>(false);

    // Selectors
    questions$ = this._questions.asObservable();
    meta$ = this._meta.asObservable();
    loading$ = this._loading.asObservable();

    constructor() { }

    loadQuestions(page: number = 1, limit: number = 10, filters?: any) {
        this._loading.next(true);

        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString())
            .set('_t', Date.now().toString()); // Cache busting

        if (filters) {
            if (filters.difficulty && filters.difficulty !== 'All') params = params.set('difficulty', filters.difficulty);
            if (filters.category && filters.category !== 'All') params = params.set('category', filters.category);
            if (filters.search) params = params.set('search', filters.search);
        }

        // Manually attach token to be safe
        const headers = this.getAuthHeaders();

        this.http.get<QuestionsResponse>(this.apiUrl, { params, headers }).pipe(
            finalize(() => this._loading.next(false))
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    this._questions.next(res.data.questions);
                    this._meta.next(res.data.pagination);
                } else {
                    console.error('QuestionService: API responded but success is false', res);
                }
            },
            error: (err) => {
                console.error('Failed to load questions', err);
                this._questions.next([]);
                // alert('Failed to load questions: ' + (err.error?.message || err.message));
            }
        });
    }

    createQuestion(data: Question): Observable<any> {
        return this.http.post(`${this.apiUrl}/add`, data).pipe(
            tap(() => {
                // Refresh list on success
                // We reload the FIRST page to show the new item (since sort is Newest First)
                this.loadQuestions(1, this._meta.value.limit);
            })
        );
    }

    updateQuestion(id: string, data: Question): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/${id}`, data, { headers }).pipe(
            tap(() => {
                // Refresh current page
                this.loadQuestions(this._meta.value.page, this._meta.value.limit);
            })
        );
    }

    deleteQuestion(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
            tap(() => {
                // Refresh current page
                this.loadQuestions(this._meta.value.page, this._meta.value.limit);
            })
        );
    }

    getQuestionById(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/${id}`, { headers });
    }

    private getAuthHeaders(): HttpHeaders {
        let headers = new HttpHeaders();
        const token = this.authService.token;
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }
}
