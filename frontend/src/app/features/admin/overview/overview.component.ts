import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-admin-overview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Welcome Header -->
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
        <p class="text-slate-500 font-medium">Platform performance and recent activity at a glance.</p>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Students</p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">1,284</h3>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">+12%</span>
            <span class="text-slate-400 text-xs font-medium">from last month</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Submissions</p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">45,201</h3>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">+3.2%</span>
            <span class="text-slate-400 text-xs font-medium">from last month</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider">Active Questions</p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">156</h3>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2 text-amber-600">
            <span class="text-xs font-bold uppercase tracking-widest">Manage Now →</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-sm font-semibold uppercase tracking-wider">Avg. Completion</p>
              <h3 class="text-2xl font-bold text-slate-900 mt-1">78.4%</h3>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">-1.5%</span>
            <span class="text-slate-400 text-xs font-medium">from last week</span>
          </div>
        </div>
      </div>

      <!-- Recent Submissions Table Mock -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-900">Recent Submissions</h3>
          <button class="text-indigo-600 text-sm font-bold hover:text-indigo-700">View All Submissions</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">JD</div>
                    <span class="font-semibold text-slate-900">John Doe</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-slate-600 font-medium">Reverse a Link List</span>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Passed</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-slate-400 text-sm">2 hours ago</span>
                </td>
              </tr>
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">AS</div>
                    <span class="font-semibold text-slate-900">Alice Smith</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-slate-600 font-medium">Valid Anagram</span>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Failed</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-slate-400 text-sm">3 hours ago</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminOverviewComponent implements OnInit {
    private adminService = inject(AdminService);

    ngOnInit() {
        // We'll fetch real data here later
    }
}
