import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Question {
    _id?: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    examples: Example[];
    constraints?: string;
    testCases: TestCase[];
    functionSignature: string;
    referenceSolution?: string;
    totalSubmissions?: number;
    totalAccepted?: number;
    successRate?: number;
    createdAt?: Date;
}

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

export interface TestCase {
    input: any; // JSON string or object depending on how we handle it
    expectedOutput: any;
    isSample: boolean;
}

export interface QuestionsResponse {
    success: boolean;
    data: {
        questions: Question[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/admin/questions`;

    private _refreshNeeded$ = new Subject<void>();

    get refreshNeeded$() {
        return this._refreshNeeded$;
    }

    constructor() { }

    addQuestion(data: Question): Observable<any> {
        return this.http.post(`${this.apiUrl}/add`, data).pipe(
            tap(() => {
                this._refreshNeeded$.next();
            })
        );
    }

    getAllQuestions(page: number = 1, limit: number = 10, filters?: any): Observable<QuestionsResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString())
            .set('_t', Date.now().toString()); // Cache busting

        if (filters) {
            if (filters.difficulty && filters.difficulty !== 'All') {
                params = params.set('difficulty', filters.difficulty);
            }
            if (filters.category && filters.category !== 'All') {
                params = params.set('category', filters.category);
            }
            if (filters.search) {
                params = params.set('search', filters.search);
            }
        }

        return this.http.get<QuestionsResponse>(this.apiUrl, { params });
    }

    getQuestionById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    updateQuestion(id: string, data: Question): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data).pipe(
            tap(() => {
                this._refreshNeeded$.next();
            })
        );
    }

    deleteQuestion(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                this._refreshNeeded$.next();
            })
        );
    }
}
