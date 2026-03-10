import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatStateService } from '../../core/services/chat-state.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private chatService = inject(ChatStateService);

  user = this.authService.currentUser;
  unreadCount = this.chatService.unreadCount;

  toggleChat() {
    this.chatService.toggleChat();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
