import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-slate-50 font-inter">
      <!-- Fixed Sidebar -->
      <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
        <div class="h-16 flex items-center px-6 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xl">T</span>
            </div>
            <span class="text-white font-bold text-lg tracking-tight">ThinkCode</span>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-slate-800 text-white" 
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span class="font-medium text-[15px]">Dashboard</span>
          </a>

          <a routerLink="/admin/questions/add" routerLinkActive="bg-slate-800 text-white" 
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="font-medium text-[15px]">Add Question</span>
          </a>

          <a routerLink="/admin/questions" routerLinkActive="bg-slate-800 text-white" [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <span class="font-medium text-[15px]">Manage Questions</span>
          </a>

          <a routerLink="/admin/submissions" routerLinkActive="bg-slate-800 text-white" 
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="font-medium text-[15px]">Submissions</span>
          </a>

          <a routerLink="/admin/statistics" routerLinkActive="bg-slate-800 text-white" 
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span class="font-medium text-[15px]">Statistics</span>
          </a>
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button (click)="logout()" 
             class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="font-medium text-[15px]">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-8">
          <div class="flex flex-col">
            <h1 class="text-xl font-bold text-slate-900 tracking-tight leading-none">ThinkCode Console</h1>
          </div>

          <div class="flex items-center gap-6">
            <!-- Search -->
            <div class="hidden md:flex relative group">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search Console... (⌘K)" 
                     class="w-80 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-0 rounded-lg pl-10 pr-4 py-2 text-sm transition-all">
            </div>

            <!-- Profile -->
            <div class="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-semibold text-slate-900 leading-none">{{ user()?.username }}</p>
                <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Admin</p>
              </div>
              <div class="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                {{ user()?.username?.substring(0, 1) | uppercase }}
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Page Content -->
        <main class="flex-1 overflow-y-auto p-5 max-w-[1600px] mx-auto w-full">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  user = this.authService.currentUser;

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
