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
    seenByMe?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ChatStateService {
    messages = signal<GlobalMessage[]>([]);
    isOpen = signal<boolean>(false);
    activeRecipient = signal<{ id: string, name: string } | null>(null);
    typingUsers = signal<Map<string, string>>(new Map()); // userId -> name

    unreadCount = computed(() => {
        const msgs = this.messages();
        const currentUser = this.authService.currentUser();
        // Count messages that are not seen and not sent by current user
        return msgs.filter(m => !m.seenByMe && m.sender !== 'You' && m.senderId !== currentUser?.id).length;
    });

    constructor(
        private socketService: SocketService,
        private authService: AuthService,
        private router: Router
    ) {
        // Hydrate state from localStorage
        const savedRecipient = localStorage.getItem('activeChatRecipient');
        if (savedRecipient) {
            try {
                const recipient = JSON.parse(savedRecipient);
                this.activeRecipient.set(recipient);
                this.loadHistory(recipient.id);
            } catch (e) {}
        }

        const savedIsOpen = localStorage.getItem('chatIsOpen');
        if (savedIsOpen === 'true') {
            this.isOpen.set(true);
        }

        this.initSocketListeners();
    }

    private initSocketListeners() {
        this.socketService.on('receiveMessage').subscribe((msg: any) => {
            console.log('Received message:', msg);
            this.playNotificationSound();

            const isCurrentChat = this.isOpen() && this.activeRecipient()?.id === msg.senderId;

            const newMessage: GlobalMessage = {
                id: Math.random().toString(36).substring(2, 9),
                sender: msg.sender,
                senderId: msg.senderId,
                receiverId: this.authService.currentUser()?.id,
                text: msg.text,
                timestamp: new Date(msg.timestamp),
                isInvite: msg.isInvite,
                meetingLink: msg.roomId ? `/interview/${msg.roomId}` : undefined,
                seenByMe: isCurrentChat
            };

            this.messages.update(msgs => [...msgs, newMessage]);

            // Auto-open chat if an invite comes in or if it's from current active recipient
            if (newMessage.isInvite || (this.activeRecipient()?.id === msg.senderId)) {
                if (newMessage.isInvite) {
                    this.activeRecipient.set({ id: msg.senderId!, name: msg.sender });
                }
                this.isOpen.set(true);
                this.markAsSeen(msg.senderId!);
            }
        });

        this.socketService.on('typing').subscribe((data: any) => {
            const currentTyping = new Map(this.typingUsers());
            currentTyping.set(data.userId, data.name);
            this.typingUsers.set(currentTyping);
        });

        this.socketService.on('stopTyping').subscribe((data: any) => {
            const currentTyping = new Map(this.typingUsers());
            currentTyping.delete(data.userId);
            this.typingUsers.set(currentTyping);
        });

        this.socketService.on('chatHistory').subscribe((data: any) => {
            console.log('Received chat history for:', data.userId);
            const currentUser = this.authService.currentUser();
            const recipient = this.activeRecipient();

            if (!currentUser || !recipient) return;

            const historyMessages: GlobalMessage[] = data.messages.map((m: any) => {
                const isFromMe = m.senderId === currentUser.id;
                return {
                    id: Math.random().toString(36).substring(2, 9),
                    sender: isFromMe ? 'You' : recipient.name,
                    senderId: m.senderId,
                    receiverId: isFromMe ? recipient.id : currentUser.id,
                    text: m.text,
                    timestamp: new Date(m.timestamp),
                    isInvite: m.isInvite,
                    meetingLink: m.roomId ? `/interview/${m.roomId}` : undefined,
                    seenByMe: true // History is considered seen
                };
            });

            this.messages.set(historyMessages);
        });
    }

    toggleChat(recipient?: { id: string, name: string }) {
        if (recipient) {
            this.activeRecipient.set(recipient);
            this.isOpen.set(true);
            localStorage.setItem('activeChatRecipient', JSON.stringify(recipient));
            localStorage.setItem('chatIsOpen', 'true');
            this.loadHistory(recipient.id);
            this.markAsSeen(recipient.id);
        } else {
            const currentIsOpen = this.isOpen();
            const newState = !currentIsOpen;
            
            if (newState) {
                if (!this.activeRecipient()) {
                    const lastMsgFromOther = this.messages().slice().reverse().find(m => m.sender !== 'You');
                    if (lastMsgFromOther && lastMsgFromOther.senderId) {
                        this.activeRecipient.set({
                            id: lastMsgFromOther.senderId,
                            name: lastMsgFromOther.sender
                        });
                        localStorage.setItem('activeChatRecipient', JSON.stringify(this.activeRecipient()));
                    }
                }
                
                if (this.activeRecipient()) {
                    this.isOpen.set(true);
                    localStorage.setItem('chatIsOpen', 'true');
                    this.loadHistory(this.activeRecipient()!.id);
                    this.markAsSeen(this.activeRecipient()!.id);
                }
            } else {
                this.isOpen.set(false);
                localStorage.setItem('chatIsOpen', 'false');
            }
        }
    }

    private markAsSeen(senderId: string) {
        this.messages.update(msgs => msgs.map(m => {
            if (m.senderId === senderId) {
                return { ...m, seenByMe: true };
            }
            return m;
        }));
    }

    loadHistory(otherUserId: string) {
        this.socketService.emit('loadChatHistory', { otherUserId });
    }

    sendTyping() {
        const recipient = this.activeRecipient();
        if (recipient) {
            this.socketService.emit('typing', { receiverId: recipient.id });
        }
    }

    sendStopTyping() {
        const recipient = this.activeRecipient();
        if (recipient) {
            this.socketService.emit('stopTyping', { receiverId: recipient.id });
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
