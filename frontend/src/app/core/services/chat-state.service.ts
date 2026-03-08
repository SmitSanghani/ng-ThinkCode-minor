import { Injectable, signal, computed } from '@angular/core';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface GlobalMessage {
    id: string;
    sender: string;
    senderId?: string;
    receiverId?: string;
    text: string;
    timestamp: Date;
    isInvite?: boolean;
    meetingLink?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatStateService {
    messages = signal<GlobalMessage[]>([]);
    isOpen = signal<boolean>(false);
    activeRecipient = signal<{ id: string, name: string } | null>(null);

    unreadCount = computed(() => {
        const msgs = this.messages();
        const currentUser = this.authService.currentUser();
        return msgs.filter(m => !this.isOpen() && m.sender !== 'You' && m.senderId !== currentUser?.id).length;
    });

    constructor(
        private socketService: SocketService,
        private authService: AuthService,
        private router: Router
    ) {
        this.initSocketListeners();
    }

    private initSocketListeners() {
        this.socketService.on('receiveMessage').subscribe((msg: any) => {
            console.log('Received message:', msg);
            this.playNotificationSound();

            const newMessage: GlobalMessage = {
                id: Math.random().toString(36).substring(2, 9),
                sender: msg.sender,
                senderId: msg.senderId,
                receiverId: this.authService.currentUser()?.id, // Added
                text: msg.text,
                timestamp: new Date(msg.timestamp),
                isInvite: msg.isInvite,
                meetingLink: msg.roomId ? `/interview/${msg.roomId}` : undefined
            };

            this.messages.update(msgs => [...msgs, newMessage]);

            // Auto-open chat if an invite comes in or if it's from current active recipient
            if (newMessage.isInvite || (this.activeRecipient()?.id === msg.senderId)) {
                if (newMessage.isInvite) {
                    this.activeRecipient.set({ id: msg.senderId!, name: msg.sender });
                }
                this.isOpen.set(true);
            }
        });
    }

    toggleChat(recipient?: { id: string, name: string }) {
        if (recipient) {
            this.activeRecipient.set(recipient);
            this.isOpen.set(true);
        } else {
            // Case: clicking navbar icon
            const currentIsOpen = this.isOpen();
            if (!currentIsOpen) {
                // If opening, try to find a default recipient if none is active
                if (!this.activeRecipient()) {
                    const lastMsgFromOther = this.messages().slice().reverse().find(m => m.sender !== 'You');
                    if (lastMsgFromOther && lastMsgFromOther.senderId) {
                        this.activeRecipient.set({
                            id: lastMsgFromOther.senderId,
                            name: lastMsgFromOther.sender
                        });
                    }
                }
                // Only open if we have someone to talk to
                if (this.activeRecipient()) {
                    this.isOpen.set(true);
                } else {
                    // Maybe show a 'No chats' message or auto-close?
                    // For now, let's allow opening if admin, maybe?
                    // Actually, if no recipient, we can't show much.
                    this.isOpen.set(false);
                }
            } else {
                this.isOpen.set(false);
            }
        }
    }

    sendMessage(text: string) {
        const user = this.authService.currentUser();
        const recipient = this.activeRecipient();
        if (!user || !recipient) return;

        const msgPayload = {
            receiverId: recipient.id,
            text: text,
            senderId: user.id, // Helpful for backend
            timestamp: new Date()
        };

        // Store locally
        this.messages.update(msgs => [...msgs, {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'You',
            senderId: user.id,
            receiverId: recipient.id, // Added
            text: text,
            timestamp: new Date()
        }]);

        // Emit via socket
        this.socketService.emit('sendMessage', msgPayload);
    }

    private playNotificationSound() {
        // try {
        //     const audio = new Audio('assets/sounds/notification.mp3');
        //     audio.play().catch(e => {
        //         this.playBeep();
        //     });
        // } catch (e) {
        //     this.playBeep();
        // }
        this.playBeep();
    }

    private playBeep() {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, startTime: number, duration: number) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, startTime);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioCtx.currentTime;
            playNote(880, now, 0.15); // High note
            playNote(660, now + 0.2, 0.2); // Low note
        } catch (e) { }
    }
}
