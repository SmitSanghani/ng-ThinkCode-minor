import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    status: 'solved' | 'attempted' | 'unsolved' | 'locked';
    isLocked: boolean;
    solvedCount: number;
    acceptanceRate?: string;
}

export interface ProblemDetail extends Problem {
    description: string;
    examples: any[];
    constraints: string | string[];
    sampleTestCases: any[];
    testCases?: any[];
    functionSignature: string;
    index?: number;
}

export interface ProblemsResponse {
    success: boolean;
    problems: Problem[];
    data?: any;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/student';

    getProblems(page: number = 1, limit: number = 12, filters: any = {}): Observable<ProblemsResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
        if (filters.category) params = params.set('category', filters.category);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.status) params = params.set('status', filters.status);

        return this.http.get<ProblemsResponse>(`${this.apiUrl}/problems`, { params });
    }

    getProblemById(id: string): Observable<ProblemDetail> {
        return this.http.get<any>(`${this.apiUrl}/problems/${id}`).pipe(
            map(res => res.data)
        );
    }

    checkAccess(id: string): Observable<{ hasAccess: boolean; plan: string; reason: string }> {
        return this.http.get<any>(`${this.apiUrl}/problems/${id}/check-access`);
    }

    executeCode(problemId: string, code: string, language: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/execute-code`, { problemId, code, language });
    }

    submitSolution(questionId: string, code: string): Observable<any> {
        return this.http.post<any>(`/api/submissions/submit`, { questionId, code });
    }

    getLatestSubmission(questionId: string): Observable<any> {
        return this.http.get<any>(`/api/submissions/latest/${questionId}`);
    }

    // --- Favorite System ---
    getFavoriteIds(): string[] {
        const stored = localStorage.getItem('th_fav_ids');
        return stored ? JSON.parse(stored) : [];
    }

    setFavoriteIds(ids: string[]) {
        localStorage.setItem('th_fav_ids', JSON.stringify(ids));
    }

    toggleFavorite(problemId: string): boolean {
        let ids = this.getFavoriteIds();
        const index = ids.indexOf(problemId);
        let active = false;

        if (index > -1) {
            ids.splice(index, 1);
        } else {
            ids.push(problemId);
            active = true;
        }

        this.setFavoriteIds(ids);
        return active;
    }
}
