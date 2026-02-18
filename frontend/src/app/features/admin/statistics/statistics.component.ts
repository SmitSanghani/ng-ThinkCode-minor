import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-admin-statistics',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Statistics</h2>
        <p class="text-slate-500 font-medium">Detailed analytics and growth trends of the ThinkCode platform.</p>
      </div>

      <!-- Summary Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div class="flex flex-col">
             <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Questions Completed</span>
             <h4 class="text-3xl font-black text-slate-900 mt-2">12,405</h4>
             <span class="text-emerald-600 text-xs font-bold mt-1">↑ 24% vs last week</span>
           </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div class="flex flex-col">
             <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Time / Question</span>
             <h4 class="text-3xl font-black text-slate-900 mt-2">18m 42s</h4>
             <span class="text-rose-600 text-xs font-bold mt-1">↓ 2m vs last week</span>
           </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div class="flex flex-col">
             <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users Today</span>
             <h4 class="text-3xl font-black text-slate-900 mt-2">482</h4>
             <span class="text-emerald-600 text-xs font-bold mt-1">↑ 8% vs yesterday</span>
           </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div class="flex flex-col">
             <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Success Rate</span>
             <h4 class="text-3xl font-black text-slate-900 mt-2">68.2%</h4>
             <span class="text-slate-400 text-xs font-bold mt-1">Stable vs last week</span>
           </div>
        </div>
      </div>

      <!-- Charts Mockup Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Submissions Trend -->
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-lg font-bold text-slate-900">Submissions Trend</h3>
            <select class="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-0">
               <option>Last 7 Days</option>
               <option>Last 30 Days</option>
            </select>
          </div>
          <div class="h-64 flex items-end gap-2 px-2">
            <div class="flex-1 bg-indigo-100 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 40%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">120</div>
            </div>
            <div class="flex-1 bg-indigo-200 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 65%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">340</div>
            </div>
            <div class="flex-1 bg-indigo-300 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 50%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">210</div>
            </div>
            <div class="flex-1 bg-indigo-400 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 85%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">560</div>
            </div>
            <div class="flex-1 bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 70%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">420</div>
            </div>
            <div class="flex-1 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-600 group relative" style="height: 95%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">780</div>
            </div>
            <div class="flex-1 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-700 group relative" style="height: 80%">
               <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">650</div>
            </div>
          </div>
          <div class="flex justify-between mt-4 px-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Mon</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Tue</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Wed</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Thu</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Fri</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Sat</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Sun</span>
          </div>
        </div>

        <!-- Grade Distribution -->
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
           <h3 class="text-lg font-bold text-slate-900 mb-8">Grade Distribution</h3>
           <div class="space-y-6">
              <div class="space-y-2">
                 <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span class="text-emerald-600">Grade A</span>
                    <span class="text-slate-400">42%</span>
                 </div>
                 <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: 42%"></div>
                 </div>
              </div>
              <div class="space-y-2">
                 <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span class="text-blue-600">Grade B</span>
                    <span class="text-slate-400">30%</span>
                 </div>
                 <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" style="width: 30%"></div>
                 </div>
              </div>
              <div class="space-y-2">
                 <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span class="text-amber-600">Grade C</span>
                    <span class="text-slate-400">18%</span>
                 </div>
                 <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500 rounded-full" style="width: 18%"></div>
                 </div>
              </div>
              <div class="space-y-2">
                 <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span class="text-rose-600">Grade F</span>
                    <span class="text-slate-400">10%</span>
                 </div>
                 <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-rose-500 rounded-full" style="width: 10%"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class StatisticsComponent implements OnInit {
    private adminService = inject(AdminService);

    ngOnInit() {
        // Analytics data loading logic
    }
}
