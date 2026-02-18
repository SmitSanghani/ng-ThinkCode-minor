import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
    selector: 'app-student-home',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    template: `
    <app-navbar></app-navbar>
    
    <main class="hero-section">
      <div class="content">
        <h1 class="title">Master Coding with <br><span class="highlight">Antigravity Speed</span></h1>
        <p class="subtitle">Join 50,000+ students learning the future of software development with our industry-leading courses.</p>
        
        <div class="cta-group">
          <button class="btn-main">Explore Courses</button>
          <button class="btn-outline">Watch Demo</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>200+</h3>
          <p>Expert Mentors</p>
        </div>
        <div class="stat-card">
          <h3>95%</h3>
          <p>Placement Rate</p>
        </div>
        <div class="stat-card">
          <h3>24/7</h3>
          <p>Support</p>
        </div>
      </div>
    </main>
  `,
    styles: [`
    .hero-section {
      min-height: 100vh;
      background: radial-gradient(circle at top right, #f5f3ff 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6rem 2rem 2rem;
      text-align: center;
    }

    .content {
      max-width: 800px;
      margin-bottom: 4rem;
    }

    .title {
      font-size: 4rem;
      font-weight: 800;
      color: #111827;
      line-height: 1.1;
      margin-bottom: 1.5rem;
    }

    .highlight {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.25rem;
      color: #4b5563;
      margin-bottom: 2.5rem;
    }

    .cta-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-main {
      padding: 1rem 2rem;
      background: #111827;
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-main:hover {
      background: #1f2937;
      transform: translateY(-2px);
    }

    .btn-outline {
      padding: 1rem 2rem;
      background: transparent;
      color: #111827;
      border: 2px solid #e5e7eb;
      border-radius: 14px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-outline:hover {
      border-color: #6366f1;
      color: #6366f1;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      width: 100%;
      max-width: 900px;
    }

    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.03);
      border: 1px solid #f3f4f6;
    }

    .stat-card h3 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #6366f1;
      margin-bottom: 0.5rem;
    }

    .stat-card p {
      color: #6b7280;
      font-weight: 500;
    }
  `]
})
export class StudentHomeComponent { }
