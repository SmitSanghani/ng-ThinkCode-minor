import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

import { FormsModule } from '@angular/forms';

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    isDeleted?: boolean;
    replyTo?: ChatMessage | null;
    reaction?: string;
}

@Component({
    selector: 'app-interview',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './interview.component.html',
    styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements OnInit, OnDestroy {
    isLoading = signal<boolean>(true);
    error = signal<string | null>(null);
    hasRemoteVideo: boolean = false;
    remoteStream: MediaStream | null = null;

    private _localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('localVideo') set localVideoElem(el: ElementRef<HTMLVideoElement>) {
        if (el) {
            console.log('Video: Local video element bound');
            this._localVideo = el;
            if (this.localStream) {
                el.nativeElement.srcObject = this.localStream;
                console.log('Video: Local stream assigned');
            }
        }
    }
    get localVideo(): ElementRef<HTMLVideoElement> { return this._localVideo; }

    private _remoteVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('remoteVideo') set remoteVideoElem(el: ElementRef<HTMLVideoElement>) {
        if (el) {
            console.log('Video: Remote video element bound');
            this._remoteVideo = el;
            if (this.remoteStream) {
                el.nativeElement.srcObject = this.remoteStream;
                console.log('Video: Remote stream assigned');
            }
        }
    }
    get remoteVideo(): ElementRef<HTMLVideoElement> { return this._remoteVideo; }

    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    public router = inject(Router);
    private http = inject(HttpClient);
    private socketService = inject(SocketService);
    public authService = inject(AuthService);

    roomId: string = '';
    interviewDetails: any = null;

    // WebRTC & Media states
    localStream!: MediaStream;
    screenStream!: MediaStream | null;
    peerConnection!: RTCPeerConnection;

    isVideoActive: boolean = true;
    isAudioActive: boolean = true;
    isSharingScreen: boolean = false;

    private socket: any;
    private isNegotiating = false;
    private iceCandidatesBuffer: RTCIceCandidateInit[] = [];

    // Editor States
    code: string = '// Start coding here...';
    selectedLanguage: string = 'javascript';
    editorOptions = { theme: 'vs-dark', language: 'javascript', lineNumbers: 'on', formatOnType: true, automaticLayout: true };
    isExecuting: boolean = false;
    executionResult: any = null;

    // Chat States
    chatMessages: ChatMessage[] = [];
    newMessage: string = '';
    replyingToMessage: ChatMessage | null = null;
    @ViewChild('chatContainer') chatContainer!: ElementRef;

    private iceServers = {
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };

    async ngOnInit() {
        this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
        if (!this.roomId) {
            this.error.set('Invalid room ID');
            this.isLoading.set(false);
            return;
        }

        try {
            console.log('Interview: Validating room...', this.roomId);
            await this.validateRoom();

            this.isLoading.set(false);
            this.cdr.detectChanges();

            console.log('Interview: Initializing socket...');
            await this.initSocket();

            // CRITICAL: Join room IMMEDIATELY so chat works while media loads
            this.socket?.emit('join-interview', { roomId: this.roomId });

            // Safety check for video binding every 2 seconds
            setInterval(() => this.ensureVideoBinding(), 2000);

            console.log('Interview: Accessing media...');
            this.startLocalMedia().then(() => {
                this.setupWebRTC();
                // Notify again in case peer joined while we were getting media
                this.socket?.emit('join-interview', { roomId: this.roomId });
            }).catch(err => {
                console.warn('Interview: Media failed, joining room anyway', err);
                this.setupWebRTC();
            });

        } catch (err: any) {
            console.error('Interview: Failed to load:', err);
            this.error.set(err.message || 'Access Denied');
            this.isLoading.set(false);
            this.cdr.detectChanges();
            Swal.fire('Error', this.error() || 'Connection Error', 'error');
        }
    }

    private initSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socketService.connect();

            let attempts = 0;
            const socketPoll = setInterval(() => {
                attempts++;
                this.socket = this.socketService.getSocket();
                if (this.socket) {
                    clearInterval(socketPoll);
                    this.setupSocketListeners();
                    resolve();
                } else if (attempts > 50) { // 5 seconds
                    clearInterval(socketPoll);
                    reject(new Error('Real-time connection failed. Check your internet or login status.'));
                }
            }, 100);
        });
    }

    private setupSocketListeners() {
        if (!this.socket) return;
        console.log('Interview: Setting up socket listeners');

        this.socket.on('user-left', () => {
            console.log('WebRTC: Peer left');
            this.hasRemoteVideo = false;
            this.remoteStream = null;
            if (this._remoteVideo?.nativeElement) {
                this._remoteVideo.nativeElement.srcObject = null;
            }
            this.cdr.markForCheck();
        });

        this.socket.on('user-joined', async (data: any) => {
            console.log('WebRTC: User joined, creating offer');
            if (this.peerConnection) {
                // Renegotiate when someone joins
                const offer = await this.peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await this.peerConnection.setLocalDescription(offer);
                this.socket.emit('webrtc-offer', { roomId: this.roomId, offer });
            }
            this.cdr.detectChanges();
        });

        this.socket.on('webrtc-offer', async (data: any) => {
            console.log('WebRTC: Received offer, state:', this.peerConnection?.signalingState);
            if (!this.peerConnection) this.setupWebRTC();
            
            // Only accept offer if we are stable
            if (this.peerConnection.signalingState !== 'stable') {
                console.warn('WebRTC: Received offer while not stable, state:', this.peerConnection.signalingState);
                return;
            }

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            
            // Flush buffered ICE candidates
            while (this.iceCandidatesBuffer.length > 0) {
                const candidate = this.iceCandidatesBuffer.shift();
                if (candidate) await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.socket.emit('webrtc-answer', { roomId: this.roomId, answer });
            this.cdr.detectChanges();
        });

        this.socket.on('webrtc-answer', async (data: any) => {
            console.log('WebRTC: Received answer, state:', this.peerConnection?.signalingState);
            if (this.peerConnection && this.peerConnection.signalingState === 'have-local-offer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                
                // Flush buffered ICE candidates
                while (this.iceCandidatesBuffer.length > 0) {
                    const candidate = this.iceCandidatesBuffer.shift();
                    if (candidate) await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } else {
                console.warn('WebRTC: PeerConnection in wrong state for answer:', this.peerConnection?.signalingState);
            }
            this.cdr.detectChanges();
        });

        this.socket.on('webrtc-candidate', async (data: any) => {
            if (this.peerConnection && data.candidate) {
                try {
                    if (this.peerConnection.remoteDescription) {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } else {
                        this.iceCandidatesBuffer.push(data.candidate);
                    }
                } catch (e) {
                    console.error('WebRTC: Error adding ICE candidate', e);
                }
            }
        });

        this.socket.on('code-change', (data: { code: string, sender: string }) => {
            if (data.sender !== this.authService.currentUser()?.id) {
                this.code = data.code;
                this.cdr.detectChanges();
            }
        });

        this.socket.on('chat-message', (msg: ChatMessage) => {
            console.log('Chat: Received message via Socket.io', msg);
            // Deduplicate local messages
            if (!this.chatMessages.some(m => m.id === msg.id)) {
                this.chatMessages = [...this.chatMessages, msg];
                this.scrollToBottom();
                this.cdr.detectChanges();
            }
        });

        this.socket.on('roomChatHistory', (data: { roomId: string, messages: any[] }) => {
            console.log('Chat: Received room history', data);
            const history: ChatMessage[] = data.messages.map(m => ({
                id: Math.random().toString(36).substring(2, 9),
                sender: m.senderId === this.authService.currentUser()?.id ? 'You' : m.sender,
                text: m.text,
                timestamp: new Date(m.timestamp)
            }));
            this.chatMessages = history;
            this.scrollToBottom();
            this.cdr.detectChanges();
        });

        this.socket.on('chat-delete', ({ messageId }: { messageId: string }) => {
            this.chatMessages = this.chatMessages.filter(m => m.id !== messageId);
            this.cdr.detectChanges();
        });

        this.socket.on('chat-react', ({ messageId, reaction }: { messageId: string, reaction: string }) => {
            const msg = this.chatMessages.find(m => m.id === messageId);
            if (msg) {
                msg.reaction = reaction;
                this.cdr.detectChanges();
            }
        });
    }

    private ensureVideoBinding() {
        if (this._localVideo?.nativeElement && this.localStream) {
            this._localVideo.nativeElement.muted = true;
            if (this._localVideo.nativeElement.srcObject !== this.localStream) {
                this._localVideo.nativeElement.srcObject = this.localStream;
            }
            if (this._localVideo.nativeElement.paused) {
                this._localVideo.nativeElement.play().catch(() => {});
            }
        }
        
        if (this._remoteVideo?.nativeElement && this.remoteStream) {
            if (this._remoteVideo.nativeElement.srcObject !== this.remoteStream) {
                console.log('Video: Force binding Remote Stream');
                this._remoteVideo.nativeElement.srcObject = this.remoteStream;
            }
            if (this._remoteVideo.nativeElement.paused) {
                this._remoteVideo.nativeElement.play().catch(e => console.error('Remote Play Error:', e));
            }
        }
    }

    ngOnDestroy() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        if (this.socket) {
            this.socket.emit('leave-interview', { roomId: this.roomId });
            this.socket.off('webrtc-offer');
            this.socket.off('webrtc-answer');
            this.socket.off('webrtc-candidate');
            this.socket.off('user-joined');
            this.socket.off('user-left');
            this.socket.off('chat-message');
            this.socket.off('code-change');
        }
    }

    private validateRoom(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.http.get<any>(`${environment.apiUrl}/interview/${this.roomId}`).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.interviewDetails = res.data;
                        resolve();
                    } else {
                        reject(new Error('Invalid interview room'));
                    }
                },
                error: (err: any) => {
                    reject(new Error(err.error?.message || 'Access denied.'));
                    this.router.navigate(['/']);
                }
            });
        });
    }

    leaveMeeting() {
        this.socket?.emit('leave-interview', { roomId: this.roomId });
        this.router.navigate(['/']);
    }

    onCodeChanged(newCode: string) {
        this.code = newCode;
        this.socket?.emit('code-change', { roomId: this.roomId, code: newCode });
    }

    onLanguageChange(event: any) {
        this.selectedLanguage = event.target.value;
        this.editorOptions = { ...this.editorOptions, language: this.selectedLanguage };
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;
        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: this.authService.currentUser()?.username || 'User',
            text: this.newMessage.trim(),
            timestamp: new Date(),
            replyTo: this.replyingToMessage
        };

        console.log('Chat: Sending message', msg);
        this.chatMessages = [...this.chatMessages, msg];

        if (this.socket) {
            this.socket.emit('chat-message', { roomId: this.roomId, message: msg });
        } else {
            console.error('Chat: Socket not ready to send');
        }

        this.newMessage = '';
        this.replyingToMessage = null;
        this.scrollToBottom();
        this.cdr.detectChanges();
    }

    setReply(msg: ChatMessage) {
        if (!msg.isDeleted) this.replyingToMessage = msg;
    }

    cancelReply() {
        this.replyingToMessage = null;
    }

    deleteMessage(msgId: string) {
        const msg = this.chatMessages.find(m => m.id === msgId);
        if (msg) {
            msg.isDeleted = true;
            this.socket?.emit('chat-delete', { roomId: this.roomId, messageId: msgId });
        }
    }

    reactToMessage(msgId: string, reaction: string) {
        const msg = this.chatMessages.find(m => m.id === msgId);
        if (msg && !msg.isDeleted) {
            msg.reaction = msg.reaction === reaction ? undefined : reaction;
            this.socket?.emit('chat-react', { roomId: this.roomId, messageId: msgId, reaction: msg.reaction });
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }

    runCode() {
        if (!this.code) return;
        this.isExecuting = true;
        this.executionResult = null;

        this.http.post<any>(`${environment.apiUrl}/interview/run`, {
            code: this.code,
            language: this.selectedLanguage
        }).subscribe({
            next: (res) => {
                this.isExecuting = false;
                this.executionResult = res;
            },
            error: (err) => {
                this.isExecuting = false;
                this.executionResult = {
                    success: false,
                    compile_error: 'Failed to run code.',
                    output: ''
                };
            }
        });
    }

    private async startLocalMedia() {
        try {
            console.log('WebRTC: Starting local media with Echo Cancellation');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            if (this._localVideo?.nativeElement) {
                this._localVideo.nativeElement.srcObject = this.localStream;
                this._localVideo.nativeElement.muted = true; // Absolute mute for local feedback
            }
            this.addLocalTracksToPeer();
        } catch (err) {
            console.error('WebRTC: Error accessing media devices.', err);
        }
    }

    private addLocalTracksToPeer() {
        if (!this.peerConnection || !this.localStream) return;
        const senders = this.peerConnection.getSenders();
        this.localStream.getTracks().forEach((track) => {
            if (!senders.some(s => s.track?.id === track.id)) {
                this.peerConnection.addTrack(track, this.localStream);
                console.log(`WebRTC: Added ${track.kind} track`);
            }
        });
    }

    private setupWebRTC() {
        if (this.peerConnection) return;
        this.peerConnection = new RTCPeerConnection(this.iceServers);
        console.log('WebRTC: Initializing RTCPeerConnection');

        this.addLocalTracksToPeer();

        this.peerConnection.ontrack = (event) => {
            console.log('WebRTC: Remote track received', event.track.kind);
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                this.hasRemoteVideo = true;
            }

            this.remoteStream.addTrack(event.track);

            if (this._remoteVideo?.nativeElement) {
                this._remoteVideo.nativeElement.srcObject = this.remoteStream;
                this._remoteVideo.nativeElement.play().catch(e => console.error('WebRTC: Play failed', e));
            }

            this.cdr.detectChanges();
            setTimeout(() => this.ensureVideoBinding(), 1000);
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket?.emit('webrtc-candidate', { roomId: this.roomId, candidate: event.candidate });
            }
        };

        this.peerConnection.onnegotiationneeded = async () => {
            if (this.isNegotiating || this.peerConnection.signalingState !== 'stable') return;
            
            try {
                this.isNegotiating = true;
                console.log('WebRTC: Negotiation needed, creating offer...');
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);
                this.socket?.emit('webrtc-offer', { roomId: this.roomId, offer });
            } catch (err) {
                console.error('WebRTC: Negotiation Error', err);
            } finally {
                this.isNegotiating = false;
            }
        };
    }

    toggleAudio() {
        this.isAudioActive = !this.isAudioActive;
        this.localStream?.getAudioTracks().forEach(t => t.enabled = this.isAudioActive);
        this.socket?.emit('mic-toggle', { roomId: this.roomId, isAudioActive: this.isAudioActive });
    }

    toggleVideo() {
        this.isVideoActive = !this.isVideoActive;
        this.localStream?.getVideoTracks().forEach(t => t.enabled = this.isVideoActive);
        this.socket?.emit('camera-toggle', { roomId: this.roomId, isVideoActive: this.isVideoActive });
    }

    async toggleScreenShare() {
        if (this.isSharingScreen) {
            this.screenStream?.getTracks().forEach(t => t.stop());
            this.screenStream = null;
            this.isSharingScreen = false;
            const videoTrack = this.localStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender && videoTrack) sender.replaceTrack(videoTrack);
            if (this._localVideo?.nativeElement) this._localVideo.nativeElement.srcObject = this.localStream;
            this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: false });
        } else {
            try {
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                this.isSharingScreen = true;
                const screenTrack = this.screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
                if (this._localVideo?.nativeElement) this._localVideo.nativeElement.srcObject = this.screenStream;
                this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: true });
                screenTrack.onended = () => this.toggleScreenShare();
            } catch (err) {
                console.error('WebRTC: Screen share failed', err);
            }
        }
    }
}
