import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html'
})
export class AdminOverviewComponent implements OnInit {
  private adminService = inject(AdminService);
  private socketService = inject(SocketService);
  private statusSub?: Subscription;

  stats$ = new BehaviorSubject<any>(null);
  loading$ = new BehaviorSubject<boolean>(true);
  error$ = new BehaviorSubject<string | null>(null);

  ngOnInit() {
    this.loadDashboardStats();
    this.listenToRealtimeStats();
  }

  listenToRealtimeStats() {
    this.statusSub = this.socketService.onlineStatus$.subscribe(update => {
      if (!update || !this.stats$.value) return;

      const currentStats = { ...this.stats$.value };
      const delta = update.isOnline ? 1 : -1;

      // Update top card
      currentStats.topCards = { ...currentStats.topCards };
      currentStats.topCards.activeStudents = Math.max(0, (currentStats.topCards.activeStudents || 0) + delta);

      // Update platform stats card
      currentStats.platformStats = { ...currentStats.platformStats };
      currentStats.platformStats.onlineUsersNow = Math.max(0, (currentStats.platformStats.onlineUsersNow || 0) + delta);

      this.stats$.next(currentStats);
    });
  }

  ngOnDestroy() {
    this.statusSub?.unsubscribe();
  }

  loadDashboardStats() {
    this.loading$.next(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success) {
          const data = res.data;
          // Process trend data to ensure 7 days are always present
          data.submissionTrend = this.processTrendData(data.submissionTrend || []);
          this.stats$.next(data);
        }
        this.loading$.next(false);
      },
      error: (err) => {
        this.error$.next('Failed to load dashboard statistics');
        this.loading$.next(false);
      }
    });
  }

  processTrendData(apiTrend: any[]): any[] {
    const result = [];
    const dateMap = new Map();

    if (apiTrend && Array.isArray(apiTrend)) {
      apiTrend.forEach(item => {
        if (item._id) dateMap.set(item._id, item.count);
      });
    }

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        _id: dateStr,
        count: dateMap.get(dateStr) || 0
      });
    }
    return result;
  }

  // Helper to format grades for the progress bars
  getGradePercent(grade: string, stats: any): number {
    if (!stats || !stats.gradeDistribution) return 0;
    const count = stats.gradeDistribution[grade] || 0;
    const total = Object.values(stats.gradeDistribution).reduce((a: any, b: any) => a + b, 0) as number;
    return total > 0 ? (count / total) * 100 : 0;
  }

  formatTime(ms: number): string {
    if (!ms) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  getTrendHeight(count: number, trend: any[]): string {
    if (!trend || trend.length === 0) return '0%';
    const max = Math.max(...trend.map(t => t.count));
    // If max is 0, height is 0. If max > 0, calculate percentage but cap at 100%
    if (max === 0) return '0%';
    const height = (count / max) * 100;
    // Add a minimum height of 4px if count > 0 so it's visible
    if (count > 0 && height < 5) return '4px';
    return `${height}%`;
  }

  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
