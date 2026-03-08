import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-global-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './global-chat.component.html',
    styleUrls: ['./global-chat.component.css']
})
export class GlobalChatComponent {
    public chatService = inject(ChatStateService);
    public authService = inject(AuthService);
    private router = inject(Router);

    isOpen = this.chatService.isOpen;
    activeRecipient = this.chatService.activeRecipient;

    // Filter messages for current 1-on-1 session
    filteredMessages = computed(() => {
        const msgs = this.chatService.messages();
        const recipient = this.activeRecipient();
        const currentUser = this.authService.currentUser();

        if (!recipient || !currentUser) return [];

        return msgs.filter(m =>
            (m.senderId === recipient.id && m.receiverId === currentUser.id) || // Received from them
            (m.sender === 'You' && m.receiverId === recipient.id) || // Sent by me to them
            (m.isInvite && m.senderId === recipient.id) // Special case for invites
        );
    });

    inputText: string = '';

    toggleChat() {
        this.chatService.toggleChat();
    }

    sendMessage() {
        if (!this.inputText.trim()) return;
        this.chatService.sendMessage(this.inputText);
        this.inputText = '';
    }

    joinMeeting(link: string) {
        if (link) {
            this.router.navigateByUrl(link);
            this.chatService.toggleChat(); // close chat
        }
    }

    rejectInvite() {
        this.chatService.sendMessage('Interview invite rejected.');
        this.chatService.toggleChat();
    }
}
