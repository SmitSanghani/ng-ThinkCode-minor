import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './core/services/socket.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { GlobalChatComponent } from './shared/components/global-chat/global-chat.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private socketService = inject(SocketService);
  private router = inject(Router);
  protected readonly title = signal('frontend');

  ngOnInit() {
    this.socketService.on('receiveMessage').subscribe((msg: any) => {
      // Play notification sound
      try {
        const audio = new Audio('assets/sounds/notification.mp3');
        // fallback sound if assets not present
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) { }

      // Find URL via regex
      const urlMatch = msg.text.match(/(https?:\/\/[^\s]+)/);
      const url = urlMatch ? urlMatch[0] : null;

      if (url && msg.text.includes('interview')) {
        // Just show a simple toast to check chat
        Swal.fire({
          title: 'Interview Invitation',
          text: `Check your messages to join the interview with ${msg.sender}`,
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000
        });
      } else {
        // Normal text message
        Swal.fire({
          title: `Message from ${msg.sender}`,
          text: msg.text,
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000
        });
      }
    });
  }
}

