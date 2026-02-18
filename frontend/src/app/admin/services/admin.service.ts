import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    // Assuming environment.apiUrl is base URL e.g. 'http://localhost:5000/api'
    // But AuthService used 'http://localhost:5000/api/auth' hardcoded.
    // I will use specific URL for now or environment if available.
    // Let's assume standard '/api' base.
    private apiUrl = '/api/admin/questions';

    constructor() { }

    addQuestion(data: Question): Observable<any> {
        return this.http.post(`${this.apiUrl}/add`, data);
    }

    getAllQuestions(page: number = 1, limit: number = 10, filters?: any): Observable<QuestionsResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

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
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    deleteQuestion(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
