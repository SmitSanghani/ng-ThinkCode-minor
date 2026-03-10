import { Component, inject, computed, NgZone, ElementRef } from '@angular/core';
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
    private zone = inject(NgZone);
    private elRef = inject(ElementRef);

    isOpen = this.chatService.isOpen;
    activeRecipient = this.chatService.activeRecipient;

    // Draggable state (for Angular binding - only updated after drop)
    posX: number | null = null;
    posY: number | null = null;
    private isDragging = false;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private currentX = 0;
    private currentY = 0;
    private boundOnDrag = this.onDrag.bind(this);
    private boundStopDrag = this.stopDrag.bind(this);

    // Filter messages for current 1-on-1 session
    filteredMessages = computed(() => {
        const msgs = this.chatService.messages();
        const recipient = this.activeRecipient();
        const currentUser = this.authService.currentUser();

        if (!recipient || !currentUser) return [];

        return msgs.filter(m =>
            (m.senderId === recipient.id) ||
            (m.senderId === currentUser.id && m.receiverId === recipient.id)
        );
    });

    inputText: string = '';
    private typingTimeout: any;

    isRecipientTyping = computed(() => {
        const recipient = this.activeRecipient();
        if (!recipient) return false;
        return this.chatService.typingUsers().has(recipient.id);
    });

    startDrag(event: MouseEvent) {
        if ((event.target as HTMLElement).closest('.close-btn')) return;

        const el = this.elRef.nativeElement.querySelector('.global-chat-container') as HTMLElement;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        this.currentX = rect.left;
        this.currentY = rect.top;

        this.dragOffsetX = event.clientX - this.currentX;
        this.dragOffsetY = event.clientY - this.currentY;
        this.isDragging = true;

        // Set initial inline styles — override CSS bottom/right positioning
        el.style.left = this.currentX + 'px';
        el.style.right = 'auto';
        el.style.top = this.currentY + 'px';
        el.style.bottom = 'auto';
        el.style.transition = 'none';

        // Run outside Angular zone for max performance (no CD on every mousemove)
        this.zone.runOutsideAngular(() => {
            document.addEventListener('mousemove', this.boundOnDrag);
            document.addEventListener('mouseup', this.boundStopDrag);
        });

        event.preventDefault();
    }

    private onDrag(event: MouseEvent) {
        if (!this.isDragging) return;

        const newX = Math.max(0, Math.min(event.clientX - this.dragOffsetX, window.innerWidth - 360));
        const newY = Math.max(0, Math.min(event.clientY - this.dragOffsetY, window.innerHeight - 100));
        this.currentX = newX;
        this.currentY = newY;

        // Directly manipulate DOM — no Angular binding overhead = butter smooth
        const el = this.elRef.nativeElement.querySelector('.global-chat-container') as HTMLElement;
        if (el) {
            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        }
    }

    private stopDrag() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.boundOnDrag);
        document.removeEventListener('mouseup', this.boundStopDrag);

        // Sync final position back into Angular state
        this.zone.run(() => {
            this.posX = this.currentX;
            this.posY = this.currentY;
        });
    }

    onInputChange() {
        this.chatService.sendTyping();

        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.chatService.sendStopTyping();
        }, 2000);
    }

    toggleChat() {
        // Reset position when closing
        this.posX = null;
        this.posY = null;
        this.chatService.toggleChat();
    }

    sendMessage() {
        if (!this.inputText.trim()) return;
        this.chatService.sendStopTyping();
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
