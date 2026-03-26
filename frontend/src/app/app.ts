import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './core/services/socket.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { GlobalChatComponent } from './shared/components/global-chat/global-chat.component';
import { ChatStateService } from './core/services/chat-state.service';
import { AuthService } from './core/services/auth.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalChatComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private socketService = inject(SocketService);
  private router = inject(Router);
  private chatService = inject(ChatStateService);
  private authService = inject(AuthService);
  protected readonly title = signal('frontend');
  
  get isInInterview(): boolean {
    return this.router.url.includes('/interview/');
  }

  ngOnInit() {
    this.socketService.connect();
    this.socketService.on('receiveMessage').subscribe((msg: any) => {
      // Check if in interview room
      const isInInterview = this.router.url.includes('/interview/');
      if (isInInterview) return;

      // Disable toast for admin (they have badge count now)
      const isUserAdmin = this.authService.currentUser()?.role === 'admin';
      if (isUserAdmin) return;

      // Disable toast if chat is already open with this person
      const isChatOpenWithSender = this.chatService.isOpen() && this.chatService.activeRecipient()?.id === msg.senderId;
      if (isChatOpenWithSender) return;

      // Find URL via regex
      const urlMatch = msg.text.match(/(https?:\/\/[^\s]+)/);
      const url = urlMatch ? urlMatch[0] : null;

      if (url && msg.text.includes('interview')) {
        // Just show a simple toast to check chat
        Swal.fire({
          title: 'Interview Invitation',
          text: `Click to join the interview with ${msg.sender}`,
          icon: 'info',
          toast: true,
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('click', () => {
              if (msg.senderId) {
                this.chatService.toggleChat({ id: msg.senderId, name: msg.sender });
              }
            });
            toast.style.cursor = 'pointer';
          }
        });
      } else {
        // Normal text message
        Swal.fire({
          title: `Message from ${msg.sender}`,
          text: msg.text,
          icon: 'info',
          toast: true,
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('click', () => {
              if (msg.senderId) {
                this.chatService.toggleChat({ id: msg.senderId, name: msg.sender });
              }
            });
            toast.style.cursor = 'pointer';
          }
        });
      }
    });
  }
}

