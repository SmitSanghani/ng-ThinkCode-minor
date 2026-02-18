import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">ThinkCode <span class="badge">Admin</span></div>
        <nav class="side-nav">
          <a class="nav-link active">Dashboard</a>
          <a class="nav-link">Students</a>
          <a class="nav-link">Courses</a>
          <a class="nav-link">Settings</a>
        </nav>
        <button (click)="logout()" class="btn-logout">Logout</button>
      </aside>

      <!-- Main Content -->
      <main class="content">
        <header class="top-header">
          <h2>Admin Overview</h2>
          <div class="user-profile">
            <span class="user-name">{{ user()?.username }}</span>
            <div class="avatar">A</div>
          </div>
        </header>

        <section class="stats-grid">
          <div class="stat-card">
            <p>Total Students</p>
            <h3>1,284</h3>
            <span class="trend up">+12.5%</span>
          </div>
          <div class="stat-card">
            <p>Active Courses</p>
            <h3>42</h3>
            <span class="trend">Stable</span>
          </div>
          <div class="stat-card">
            <p>Total Revenue</p>
            <h3>$48,500</h3>
            <span class="trend up">+8.2%</span>
          </div>
        </section>

        <section class="recent-activity">
          <h3>Recent Registrations</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John Doe</td>
                <td>Student</td>
                <td>2 mins ago</td>
                <td><span class="tag active">Verified</span></td>
              </tr>
              <tr>
                <td>Admin User</td>
                <td>Admin</td>
                <td>1 hour ago</td>
                <td><span class="tag active">System</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  `,
    styles: [`
    .admin-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      background: #f8fafc;
    }

    .sidebar {
      background: #0f172a;
      color: white;
      padding: 2rem;
      display: flex;
      flex-direction: column;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 3rem;
    }

    .badge {
      font-size: 0.7rem;
      background: #6366f1;
      padding: 2px 6px;
      border-radius: 4px;
      vertical-align: middle;
    }

    .side-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.3s;
      cursor: pointer;
    }

    .nav-link.active, .nav-link:hover {
      background: #1e293b;
      color: white;
    }

    .btn-logout {
      margin-top: 2rem;
      padding: 0.75rem;
      background: #334155;
      color: #cbd5e1;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .content {
      padding: 2rem 3.5rem;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: #6366f1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    .stat-card p {
      color: #64748b;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .stat-card h3 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
    }

    .trend {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f1f5f9;
    }

    .trend.up {
      color: #10b981;
      background: #ecfdf5;
    }

    .recent-activity {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    .recent-activity h3 {
      margin-bottom: 1.5rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 1rem;
      color: #64748b;
      border-bottom: 1px solid #f1f5f9;
    }

    .data-table td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .tag {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    .tag.active {
      background: #dcfce7;
      color: #166534;
    }
  `]
})
export class AdminDashboardComponent {
    private authService = inject(AuthService);
    user = this.authService.currentUser;

    logout() {
        this.authService.logout();
    }
}
