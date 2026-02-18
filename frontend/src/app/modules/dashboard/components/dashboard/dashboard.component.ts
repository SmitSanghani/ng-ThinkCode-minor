import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Welcome, {{ user()?.email }}!</h1>
      <p>This is a protected dashboard.</p>
      <div class="user-info">
        <p><strong>Email:</strong> {{ user()?.email }}</p>
        <p><strong>Role:</strong> {{ user()?.role }}</p>
        <p><strong>User ID:</strong> {{ user()?.id }}</p>
      </div>
      <button (click)="logout()" class="btn btn-danger">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .user-info {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .btn {
      padding: 10px 15px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Expose the signal directly
  user = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
