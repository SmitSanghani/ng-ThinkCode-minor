import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-admin-submissions',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div class="flex flex-col gap-1">
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Student Submissions</h2>
          <p class="text-slate-500 font-medium">Track and review student solutions in real-time.</p>
        </div>
        <button (click)="loadSubmissions()" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <select class="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all">
          <option value="">All Statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <select class="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all">
          <option value="">All Grades</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
          <option value="F">Grade F</option>
        </select>
      </div>

      <!-- Table Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Execution</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let s of submissions" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {{ s.student?.username?.substring(0, 1) | uppercase }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-slate-900 leading-tight">{{ s.student?.username }}</span>
                      <span class="text-[11px] text-slate-400 font-medium">{{ s.student?.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-slate-700 font-semibold">{{ s.question?.title }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span [ngClass]="{
                      'text-emerald-600': s.status === 'passed',
                      'text-rose-600': s.status === 'failed',
                      'text-slate-400': s.status === 'pending'
                    }" class="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-tight">
                      <svg *ngIf="s.status === 'passed'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <svg *ngIf="s.status === 'failed'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                      {{ s.status }}
                    </span>
                    <span class="text-[11px] text-slate-400 font-bold" *ngIf="s.totalTests > 0">
                      ({{ s.passedCount }}/{{ s.totalTests }})
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span [ngClass]="{
                    'bg-emerald-100 text-emerald-700': s.grade === 'A',
                    'bg-blue-100 text-blue-700': s.grade === 'B',
                    'bg-amber-100 text-amber-700': s.grade === 'C',
                    'bg-rose-100 text-rose-700': s.grade === 'F',
                    'bg-slate-100 text-slate-500': s.grade === 'Pending'
                  }" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold">
                    {{ s.grade }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-slate-400 text-sm leading-none italic">{{ s.submittedAt | date:'shortTime' }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Details</button>
                </td>
              </tr>
              <!-- Empty state -->
              <tr *ngIf="submissions.length === 0 && !isLoading">
                <td colspan="6" class="px-6 py-20 text-center text-slate-400 font-medium">No submissions recorded yet.</td>
              </tr>
              <!-- Loading -->
              <tr *ngIf="isLoading">
                <td colspan="6" class="px-6 py-20 text-center text-slate-400 font-medium">Fetching history...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SubmissionsComponent implements OnInit {
    private adminService = inject(AdminService);
    submissions: any[] = [];
    isLoading = false;

    ngOnInit() {
        this.loadSubmissions();
    }

    loadSubmissions() {
        this.isLoading = true;
        this.adminService.getSubmissions().subscribe({
            next: (res) => {
                this.submissions = res.data;
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }
}
