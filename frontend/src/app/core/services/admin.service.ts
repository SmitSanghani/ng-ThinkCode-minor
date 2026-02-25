import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}`;

    // Question endpoints
    getQuestions(params?: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/questions`, { params });
    }

    getQuestion(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/questions/${id}`);
    }

    createQuestion(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/questions`, data);
    }

    updateQuestion(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/questions/${id}`, data);
    }

    deleteQuestion(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/questions/${id}`);
    }

    getQuestionStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/questions/admin/stats`);
    }

    // Submission endpoints
    getSubmissions(params?: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/submissions`, { params });
    }

    getSubmissionStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/submissions/stats`);
    }

    updateSubmissionGrade(id: string, grade: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/submissions/${id}/grade`, { grade });
    }

    deleteSubmission(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/submissions/${id}`);
    }
}
