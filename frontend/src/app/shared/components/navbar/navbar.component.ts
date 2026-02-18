import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">
          <span class="gradient-text">ThinkCode</span>
        </a>
        
        <div class="nav-links">
          <a routerLink="/website/home" routerLinkActive="active" class="nav-item">Home</a>
          <a routerLink="/courses" class="nav-item">Courses</a>
          <a routerLink="/community" class="nav-item">Community</a>
        </div>

        <div class="nav-actions">
          <ng-container *ngIf="user(); else authButtons">
            <span class="user-greeting">Hi, {{ user()?.username }}</span>
            <button (click)="logout()" class="btn-logout">Logout</button>
          </ng-container>
          <ng-template #authButtons>
            <a routerLink="/login" class="nav-item">Login</a>
            <a routerLink="/register" class="btn-primary">Get Started</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    .navbar {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 1200px;
      padding: 0.75rem 2rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      z-index: 1000;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      text-decoration: none;
    }

    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
    }

    .nav-item {
      text-decoration: none;
      color: #4b5563;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .nav-item:hover, .nav-item.active {
      color: #6366f1;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .user-greeting {
      font-weight: 500;
      color: #1f2937;
    }

    .btn-logout {
      padding: 0.5rem 1rem;
      background: #fee2e2;
      color: #ef4444;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-logout:hover {
      background: #fecaca;
    }

    .btn-primary {
      padding: 0.6rem 1.25rem;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
      transition: transform 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
    }
  `]
})
export class NavbarComponent {
    private authService = inject(AuthService);
    user = this.authService.currentUser;

    logout() {
        this.authService.logout();
    }
}
