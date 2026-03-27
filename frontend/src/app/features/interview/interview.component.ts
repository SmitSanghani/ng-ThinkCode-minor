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
    senderId?: string;
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
    isRemoteConnected: boolean = false;
    remoteHasVideo = signal<boolean>(false);
    isRemoteAudioActive = signal<boolean>(true);
    localHasVideo = signal<boolean>(false);

    private _localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('localVideo') set localVideoElem(el: ElementRef<HTMLVideoElement>) {
        if (el) {
            console.log('[Video] Local video element bound');
            this._localVideo = el;
            if (this.localStream) {
                el.nativeElement.srcObject = this.localStream;
                el.nativeElement.muted = true;
                console.log('[Video] Local stream assigned to element');
            }
        }
    }
    get localVideo(): ElementRef<HTMLVideoElement> { return this._localVideo; }

    private _remoteVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('remoteVideo') set remoteVideoElem(el: ElementRef<HTMLVideoElement>) {
        if (el) {
            console.log('[Video] Remote video element bound');
            this._remoteVideo = el;
            if (this.remoteStream) {
                el.nativeElement.srcObject = this.remoteStream;
                console.log('[Video] Remote stream assigned to element via setter');
                el.nativeElement.play().catch(() => {});
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
    isRemoteSharing: boolean = false;

    private socket: any;
    private isNegotiating = false;
    private isReadyToNegotiate = false;
    private iceCandidatesBuffer: RTCIceCandidateInit[] = [];
    isInterviewer: boolean = false;
    private videoBindInterval: any;
    isRemoteMaximized: boolean = false;

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
    isChatVisibleOnMobile = signal<boolean>(false);
    hasNewMessage = signal<boolean>(false);
    @ViewChild('chatContainer') chatContainer!: ElementRef;

    toggleMobileChat() {
        this.isChatVisibleOnMobile.set(!this.isChatVisibleOnMobile());
        if (this.isChatVisibleOnMobile()) {
            this.hasNewMessage.set(false);
            setTimeout(() => this.scrollToBottom(), 100);
        }
    }

    private iceServers: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.metered.ca:80' },
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    };


    async ngOnInit() {
        this.isAudioActive = true;
        this.isVideoActive = true;

        this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
        if (!this.roomId) {
            this.error.set('Invalid room ID');
            this.isLoading.set(false);
            return;
        }

        try {
            console.log('[Interview] Validating room...', this.roomId);
            await this.validateRoom();

            this.isLoading.set(false);
            this.cdr.detectChanges();

            // Get interview role BEFORE setting up anything
            // Fallback: read userId from localStorage if signal is not populated (app init timeout)
            let currentUserId = this.authService.currentUser()?.id
                || this.authService.currentUser()?.['_id'];

            if (!currentUserId) {
                // Signal not populated — read directly from localStorage
                try {
                    const stored = localStorage.getItem('user');
                    if (stored) {
                        const parsedUser = JSON.parse(stored);
                        currentUserId = parsedUser.id || parsedUser._id;
                        // Also restore the signal so the rest of the app works
                        this.authService.currentUser.set(parsedUser);
                        this.authService.isAuthenticated.set(true);
                        console.log('[Interview] Restored currentUser from localStorage:', currentUserId);
                    }
                } catch (e) {}
            }

            const interviewerData = this.interviewDetails?.interviewerId;
            const interviewerId = interviewerData?._id || interviewerData;
            this.isInterviewer = interviewerId?.toString() === currentUserId?.toString();
            console.log('[Interview] Is Interviewer?', this.isInterviewer, '| currentUserId:', currentUserId, '| interviewerId:', interviewerId?.toString());

            // STEP 1: Connect socket
            console.log('[Interview] Initializing socket...');
            await this.initSocket();

            // STEP 2: Get media (MUST happen before WebRTC setup)
            console.log('[WebRTC] Accessing media devices...');
            await this.startLocalMedia();

            // STEP 3: Create RTCPeerConnection (AFTER media is ready, NO transceivers here)
            console.log('[WebRTC] Setting up peer connection...');
            this.setupWebRTC();

            // STEP 4: Attach all socket listeners
            this.setupSocketListeners();

            // STEP 5: Mark ready and join room
            this.isReadyToNegotiate = true;

            // Safety check for video binding every 2 seconds
            this.videoBindInterval = setInterval(() => this.ensureVideoBinding(), 2000);

            console.log('[Interview] Joining room...');
            this.joinInterviewRoom();

            // Re-join room if socket reconnects
            this.socket.on('connect', () => {
                console.log('[WebRTC] Socket reconnected, re-joining room...');
                this.joinInterviewRoom();
            });

        } catch (err: any) {
            console.error('[Interview] Failed to load:', err);
            this.error.set(err.message || 'Access Denied');
            this.isLoading.set(false);
            this.cdr.detectChanges();
            Swal.fire('Error', this.error() || 'Connection Error', 'error');
        }
    }

    private initSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socketService.getSocket()?.connected) {
                this.socket = this.socketService.getSocket();
                resolve();
                return;
            }

            this.socketService.connect();

            let attempts = 0;
            const socketPoll = setInterval(() => {
                attempts++;
                this.socket = this.socketService.getSocket();
                if (this.socket?.connected) {
                    clearInterval(socketPoll);
                    resolve();
                } else if (attempts > 300) { // 30 seconds
                    clearInterval(socketPoll);
                    reject(new Error('Signaling server unreachable. Check your network.'));
                }
            }, 100);
        });
    }

    private setupSocketListeners() {
        if (!this.socket) return;
        console.log('[Interview] Setting up socket listeners');

        this.socket.on('user-left', () => {
            console.log('[WebRTC] Peer left');
            this.isRemoteConnected = false;
            this.hasRemoteVideo = false;
            this.remoteHasVideo.set(false);
            this.remoteStream = null;
            if (this._remoteVideo?.nativeElement) {
                this._remoteVideo.nativeElement.srcObject = null;
            }
            // Reset and recreate peer connection so it's ready for a new caller
            this.resetPeerConnection();
            this.cdr.markForCheck();
        });

        this.socket.on('user-joined', (data: any) => {
            console.log(`[Socket] User entered: ${data.userId} | Role: ${data.role}`);
            this.isRemoteConnected = true;
            this.cdr.detectChanges();
        });

        // NEW: Handles full room state from server
        this.socket.on('room-presence-update', (data: { roomId: string, participants: string[], activeUserId?: string }) => {
            console.log('[Socket] Room Presence Sync:', data.participants);
            
            const currentUserId = this.authService.currentUser()?.id || this.authService.currentUser()?.['_id'];
            const hasOther = data.participants.some(pid => pid.toString() !== currentUserId?.toString());

            if (hasOther) {
                console.log('[Socket] Internal: Peer detected in room sync');
                this.isRemoteConnected = true;
                
                // If I am Host and Guest is here — check if I need to initiate
                const interviewerId = this.interviewDetails?.interviewerId?._id || this.interviewDetails?.interviewerId;
                if (this.isInterviewer && data.activeUserId && data.activeUserId.toString() !== currentUserId?.toString()) {
                    console.log('[WebRTC] Guest recently joined. Negotiating...');
                    setTimeout(() => this.initiateNegotiation(), 1000);
                }
            } else {
                this.isRemoteConnected = false;
                this.hasRemoteVideo = false;
            }
            this.cdr.detectChanges();
        });

        // NEW: Handle request for my media status
        this.socket.on('request-media-status', () => {
            console.log('[Socket] Remote peer requested my media status');
            this.socket.emit('media-status', {
                roomId: this.roomId,
                isVideoActive: this.isVideoActive && this.localHasVideo(),
                isAudioActive: this.isAudioActive
            });
        });

        this.socket.on('request-negotiation', () => {
            console.log('[WebRTC] Negotiation requested by remote');
            this.isRemoteConnected = true;
            if (this.isInterviewer) {
                setTimeout(() => this.initiateNegotiation(), 500);
            }
        });

        this.socket.on('webrtc-offer', async (data: any) => {
            const state = this.peerConnection?.signalingState;
            console.log(`[WebRTC] Received offer | signalingState: ${state}`);
            this.isRemoteConnected = true;

            if (!this.peerConnection) {
                console.warn('[WebRTC] No peer connection! Setting up...');
                this.setupWebRTC();
            }

            // Polite peer (guest) backs off on offer collision
            const offerCollision = data.offer?.type === 'offer' &&
                (this.isNegotiating || state !== 'stable');
            if (!this.isInterviewer && offerCollision) {
                console.warn('[WebRTC] Offer collision — Guest rolling back local description');
                await this.peerConnection.setLocalDescription({ type: 'rollback' }).catch(() => {});
            } else if (this.isInterviewer && offerCollision) {
                console.warn('[WebRTC] Offer collision ignored — Host is impolite peer');
                return;
            }

            try {
                console.log('[WebRTC] Setting remote description (offer)...');
                // FIX: Never munge a remote description. Use it exactly as received.
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                console.log('[WebRTC] Remote description set (offer). Creating answer...');

                await this.flushIceCandidateBuffer();

                const answer = await this.peerConnection.createAnswer();
                // FIX: Only munge our OWN local description before setting
                const mungedSdp = this.preferH264(answer.sdp!);
                const localAnswer = new RTCSessionDescription({ type: 'answer', sdp: mungedSdp });
                
                await this.peerConnection.setLocalDescription(localAnswer);
                this.socket.emit('webrtc-answer', { roomId: this.roomId, answer: localAnswer });
                console.log('[WebRTC] Answer sent to peer');
            } catch (err) {
                console.error('[WebRTC] Error handling offer:', err);
            }
            this.cdr.detectChanges();
        });

        this.socket.on('webrtc-answer', async (data: any) => {
            const state = this.peerConnection?.signalingState;
            console.log(`[WebRTC] Received answer | signalingState: ${state}`);
            this.isRemoteConnected = true;

            if (!this.peerConnection) return;

            if (state === 'have-local-offer') {
                try {
                    console.log('[WebRTC] Setting remote description (answer)...');
                    // FIX: Never munge a remote description.
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                    console.log('[WebRTC] Answer applied. Connection negotiated!');

                    await this.flushIceCandidateBuffer();
                } catch (err) {
                    console.error('[WebRTC] Error applying answer:', err);
                }
            } else {
                console.warn(`[WebRTC] Ignoring answer — wrong state: ${state}`);
            }
            this.cdr.detectChanges();
        });

        this.socket.on('webrtc-candidate', async (data: any) => {
            if (!data.candidate) return;
            console.log('[WebRTC] ICE candidate received from peer');

            if (!this.peerConnection) return;

            if (this.peerConnection.remoteDescription) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log('[WebRTC] ICE candidate added successfully');
                } catch (e) {
                    console.warn('[WebRTC] Failed to add ICE candidate:', e);
                }
            } else {
                console.warn('[WebRTC] Buffering ICE candidate (no remote desc yet)');
                this.iceCandidatesBuffer.push(data.candidate);
            }
        });

        this.socket.on('code-change', (data: { code: string, sender: string }) => {
            if (data.sender !== this.authService.currentUser()?.id) {
                this.code = data.code;
                this.cdr.detectChanges();
            }
        });

        this.socket.on('chat-message', (msg: ChatMessage) => {
            if (!this.chatMessages.some(m => m.id === msg.id)) {
                if (this.isCurrentUser(msg.senderId)) {
                    msg.sender = 'You';
                }
                this.chatMessages = [...this.chatMessages, msg];
                if (!this.isChatVisibleOnMobile() && !this.isCurrentUser(msg.senderId)) {
                    this.hasNewMessage.set(true);
                }
                this.scrollToBottom();
                this.cdr.detectChanges();
            }
        });

        this.socket.on('roomChatHistory', (data: { roomId: string, messages: any[] }) => {
            const history: ChatMessage[] = data.messages.map(m => {
                const isFromMe = this.isCurrentUser(m.senderId);
                return {
                    id: Math.random().toString(36).substring(2, 9),
                    sender: isFromMe ? 'You' : (m.sender || 'Other'),
                    senderId: m.senderId,
                    text: m.text,
                    timestamp: new Date(m.timestamp)
                };
            });
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

        this.socket.on('peer-media-status', (data: any) => {
            console.log('[WebRTC] Peer media status:', data);
            this.isRemoteConnected = true;
            this.remoteHasVideo.set(data.isVideoActive);
            this.isRemoteAudioActive.set(data.isAudioActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-camera-toggled', ({ isVideoActive }: { isVideoActive: boolean }) => {
            console.log('[WebRTC] Peer camera toggled:', isVideoActive);
            this.isRemoteConnected = true;
            this.remoteHasVideo.set(isVideoActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-mic-toggled', ({ isAudioActive }: { isAudioActive: boolean }) => {
            this.isRemoteConnected = true;
            this.isRemoteAudioActive.set(isAudioActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-screen-share', ({ isSharing }: { isSharing: boolean }) => {
            console.log('[WebRTC] Peer screen share:', isSharing);
            this.isRemoteSharing = isSharing;
            if (isSharing) {
                this.isRemoteMaximized = true;
                this.remoteHasVideo.set(true);
            }
            this.cdr.detectChanges();
        });

        this.socket.on('interview-ended', () => {
            Swal.fire({
                title: 'Meeting Ended',
                text: 'This interview has been completed and the link has expired.',
                icon: 'info',
                confirmButtonText: 'OK'
            }).then(() => this.finalizeLeave());
        });
    }

    // ─── Core Video Binding ───────────────────────────────────────────────────

    private ensureVideoBinding() {
        // Local video binding
        if (this._localVideo?.nativeElement) {
            const streamToBind = this.isSharingScreen ? this.screenStream : this.localStream;
            if (streamToBind && this._localVideo.nativeElement.srcObject !== streamToBind) {
                console.log('[Video] Refreshing local video binding');
                this._localVideo.nativeElement.srcObject = streamToBind;
                this._localVideo.nativeElement.muted = true;
            }
        }

        // Remote video binding — bind whenever we have a stream, regardless of track state
        if (this._remoteVideo?.nativeElement && this.remoteStream) {
            const video = this._remoteVideo.nativeElement;
            const tracks = this.remoteStream.getVideoTracks();

            if (tracks.length > 0) {
                if (video.srcObject !== this.remoteStream) {
                    console.log('[Video] Force binding remote stream to video element');
                    video.srcObject = this.remoteStream;
                }
                if (video.paused) {
                    video.play().catch(e => console.warn('[Video] Remote play error:', e));
                }
                // Always ensure remoteHasVideo is true when we have tracks
                if (!this.remoteHasVideo()) {
                    console.log('[Video] Forcing remoteHasVideo = true (stream has tracks)');
                    this.remoteHasVideo.set(true);
                }
            }
        }
        this.cdr.detectChanges();
    }

    // ─── Peer Connection Reset (when peer leaves) ─────────────────────────────

    private resetPeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.ontrack = null;
            this.peerConnection.onicecandidate = null;
            this.peerConnection.oniceconnectionstatechange = null;
            this.peerConnection.onnegotiationneeded = null;
            this.peerConnection.close();
            this.peerConnection = null as any;
        }
        this.iceCandidatesBuffer = [];
        this.isNegotiating = false;
        this.setupWebRTC();
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    ngOnDestroy() {
        if (this.videoBindInterval) clearInterval(this.videoBindInterval);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null as any;
        }

        if (this.socket) {
            this.socket.emit('leave-interview', { roomId: this.roomId });
            ['webrtc-offer', 'webrtc-answer', 'webrtc-candidate', 'user-joined', 'user-left',
             'room-presence-update', 'request-media-status', 'chat-message', 'code-change', 
             'peer-media-status', 'peer-camera-toggled', 'peer-mic-toggled', 'peer-screen-share', 
             'interview-ended', 'roomChatHistory', 'chat-delete', 'chat-react', 
             'request-negotiation', 'connect'].forEach(ev => {
                this.socket.off(ev);
            });
        }
    }

    // ─── Room Joining ─────────────────────────────────────────────────────────

    private joinInterviewRoom() {
        if (!this.socket?.connected) return;

        const deviceInfo = this.getDeviceInfo();
        console.log('[Interview] Joining room:', this.roomId, 'Device:', deviceInfo);

        this.socket.emit('join-interview', { roomId: this.roomId, deviceInfo });
        this.socket.emit('media-status', {
            roomId: this.roomId,
            isVideoActive: this.isVideoActive && this.localHasVideo(),
            isAudioActive: this.isAudioActive
        });
    }

    private getDeviceInfo(): string {
        const ua = navigator.userAgent;
        if (ua.indexOf('Win') !== -1) return 'Windows PC';
        if (ua.indexOf('Mac') !== -1) return 'Macintosh';
        if (ua.indexOf('Linux') !== -1) return 'Linux PC';
        if (ua.indexOf('Android') !== -1) return 'Android Phone';
        if (ua.indexOf('iPhone') !== -1) return 'iPhone';
        return 'Unknown Device';
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

    // ─── Media ────────────────────────────────────────────────────────────────

    private async startLocalMedia() {
        try {
            console.log('[WebRTC] Requesting camera + microphone...');
            const constraints: MediaStreamConstraints = {
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            };

            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('[WebRTC] Video + Audio granted');
            } catch (videoError: any) {
                console.warn('[WebRTC] Full media failed, trying audio-only...', videoError.name);
                if (['NotFoundError', 'DevicesNotFoundError', 'NotAllowedError'].includes(videoError.name)) {
                    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.isVideoActive = false;
                    console.log('[WebRTC] Audio-only stream granted');
                } else {
                    throw videoError;
                }
            }

            // Bind to local video element
            if (this._localVideo?.nativeElement) {
                this._localVideo.nativeElement.srcObject = this.localStream;
                this._localVideo.nativeElement.muted = true;
                this._localVideo.nativeElement.play().catch(() => {});
            }

            this.localHasVideo.set(this.localStream.getVideoTracks().length > 0);
            console.log('[WebRTC] Local tracks:', this.localStream.getTracks().map(t => `${t.kind}(${t.readyState})`));

        } catch (err: any) {
            console.error('[WebRTC] Media error:', err);
            if (err.message?.includes('microphone')) {
                Swal.fire('Hardware Error', err.message, 'error');
            }
        }
    }

    // ─── WebRTC Core ──────────────────────────────────────────────────────────

    private setupWebRTC() {
        if (this.peerConnection) return;
        console.log('[WebRTC] Creating RTCPeerConnection...');

        this.peerConnection = new RTCPeerConnection({
            ...this.iceServers,
            iceCandidatePoolSize: 0
        });

        // Add local tracks FIRST — no addTransceiver() here, tracks create their own transceivers
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
                console.log(`[WebRTC] Added local ${track.kind} track`);
            });
        }

        // Handle incoming remote tracks
        this.peerConnection.ontrack = (event: RTCTrackEvent) => {
            console.log(`[WebRTC] *** REMOTE TRACK RECEIVED *** kind=${event.track.kind} state=${event.track.readyState}`);
            console.log('[WebRTC] Streams in event:', event.streams.length);

            // FIX: Use event.streams[0] directly — most reliable approach
            // Only fallback to building our own MediaStream if browser doesn't provide one
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                console.log('[WebRTC] Using event.streams[0] directly as remoteStream');
            } else {
                // Fallback: build stream manually
                if (!this.remoteStream) this.remoteStream = new MediaStream();
                const exists = this.remoteStream.getTracks().find(t => t.id === event.track.id);
                if (!exists) this.remoteStream.addTrack(event.track);
                console.log('[WebRTC] Built remoteStream manually (no event.streams[0])');
            }

            if (event.track.kind === 'video') {
                this.hasRemoteVideo = true;
                this.remoteHasVideo.set(true);
                this.isRemoteConnected = true;
                console.log('[WebRTC] Remote VIDEO track ready — will bind stream...');

                event.track.onunmute = () => {
                    console.log('[WebRTC] Remote video track unmuted');
                    this.remoteHasVideo.set(true);
                    this.bindRemoteStream();
                    this.cdr.detectChanges();
                };
                event.track.onmute = () => console.log('[WebRTC] Remote video track muted');
                event.track.onended = () => {
                    console.log('[WebRTC] Remote video track ended');
                    this.remoteHasVideo.set(false);
                    this.cdr.detectChanges();
                };
            }

            if (event.track.kind === 'audio') {
                this.isRemoteAudioActive.set(true);
                console.log('[WebRTC] Remote AUDIO track ready');
            }

            // FIX: Force change detection FIRST so *ngIf="isRemoteConnected" renders the
            // <video #remoteVideo> element, THEN bind the stream after DOM update
            this.cdr.detectChanges();
            setTimeout(() => {
                this.bindRemoteStream();
                this.cdr.detectChanges();
            }, 100);
        };

        // ICE candidate exchange
        this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE candidate to peer');
                this.socket?.emit('webrtc-candidate', { roomId: this.roomId, candidate: event.candidate });
            } else {
                console.log('[WebRTC] ICE gathering complete');
            }
        };

        // ICE connection state monitoring
        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState;
            console.log(`[WebRTC] ICE connection state: ${state}`);
            if (state === 'failed') {
                console.warn('[WebRTC] ICE failed — attempting restart...');
                this.peerConnection.restartIce();
            }
            if (state === 'connected' || state === 'completed') {
                console.log('[WebRTC] ✅ Peers are CONNECTED via ICE');
                this.ensureVideoBinding();
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log(`[WebRTC] Peer connection state: ${this.peerConnection?.connectionState}`);
        };

        this.peerConnection.onsignalingstatechange = () => {
            console.log(`[WebRTC] Signaling state: ${this.peerConnection?.signalingState}`);
        };

        // Only the Host (impolite peer) auto-negotiates
        this.peerConnection.onnegotiationneeded = async () => {
            // FIX: Only initiate if we have someone to negotiate WITH
            if (this.isInterviewer && this.isReadyToNegotiate && this.isRemoteConnected) {
                console.log('[WebRTC] onnegotiationneeded fired (Host) — initiating offer...');
                await this.initiateNegotiation();
            } else if (this.isInterviewer && this.isReadyToNegotiate) {
                console.log('[WebRTC] Delaying negotiation until peer connects...');
            }
        };
    }

    private bindRemoteStream() {
        if (!this.remoteStream) return;

        if (this._remoteVideo?.nativeElement) {
            const video = this._remoteVideo.nativeElement;
            if (video.srcObject !== this.remoteStream) {
                console.log('[Video] Binding remote stream to <video> element');
                video.srcObject = this.remoteStream;
            }
            video.play().catch(e => console.warn('[Video] Remote video play() failed:', e));
        } else {
            console.warn('[Video] Remote video element not in DOM yet — interval will retry');
        }
        this.cdr.detectChanges();
    }

    private async flushIceCandidateBuffer() {
        console.log(`[WebRTC] Flushing ${this.iceCandidatesBuffer.length} buffered ICE candidates`);
        while (this.iceCandidatesBuffer.length > 0) {
            const cand = this.iceCandidatesBuffer.shift();
            if (cand) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
                    console.log('[WebRTC] Flushed buffered candidate');
                } catch (e) {
                    console.warn('[WebRTC] Failed to add buffered candidate:', e);
                }
            }
        }
    }

    private async initiateNegotiation() {
        if (!this.peerConnection || this.isNegotiating) {
            console.log('[WebRTC] Skipping negotiation — already in progress');
            return;
        }

        const state = this.peerConnection.signalingState;
        if (state !== 'stable') {
            console.warn(`[WebRTC] Cannot initiate NEW offer — state is ${state}`);
            // RECOVERY: If we already have a local offer, re-send it to the sync'd room
            if (state === 'have-local-offer') {
                console.log('[WebRTC] Re-sending pending local offer to room sync...');
                this.socket.emit('webrtc-offer', { 
                    roomId: this.roomId, 
                    offer: this.peerConnection.localDescription 
                });
            }
            return;
        }

        this.isNegotiating = true;
        console.log('[WebRTC] Creating fresh offer...');

        try {
            const offer = await this.peerConnection.createOffer();
            // FIX: Prioritize H.264 for offer too
            const mungedSdp = this.preferH264(offer.sdp!);
            const localOffer = new RTCSessionDescription({ type: 'offer', sdp: mungedSdp });
            
            await this.peerConnection.setLocalDescription(localOffer);
            this.socket.emit('webrtc-offer', { roomId: this.roomId, offer: localOffer });
            console.log('[WebRTC] Offer sent to peer. Host is now have-local-offer.');
        } catch (err) {
            console.error('[WebRTC] Offer creation failed:', err);
        } finally {
            setTimeout(() => { this.isNegotiating = false; }, 500);
        }
    }

    // Prioritize H.264 codec for better mobile/Safari compatibility
    private preferH264(sdp: string): string {
        if (!sdp.includes('H264')) return sdp;
        const lines = sdp.split('\r\n');
        const videoIndex = lines.findIndex(l => l.startsWith('m=video'));
        if (videoIndex === -1) return sdp;

        const mLine = lines[videoIndex].split(' ');
        const h264Payloads = lines
            .filter(l => l.startsWith('a=rtpmap') && l.includes('H264'))
            .map(l => l.split(':')[1].split(' ')[0]);

        if (h264Payloads.length === 0) return sdp;

        const newMLine = mLine.slice(0, 3);
        const otherPayloads = mLine.slice(3).filter(p => !h264Payloads.includes(p));
        lines[videoIndex] = [...newMLine, ...h264Payloads, ...otherPayloads].join(' ');
        return lines.join('\r\n');
    }

    // ─── Controls ─────────────────────────────────────────────────────────────

    leaveMeeting() {
        if (this.isInterviewer) {
            // Directly mark as completed and expire the link
            this.http.patch(`${environment.apiUrl}/interview/${this.roomId}/complete`, {}).subscribe({
                next: () => {
                    this.finalizeLeave();
                },
                error: () => {
                    this.finalizeLeave(); // Leave anyway even if API fails
                }
            });
        } else {
            this.finalizeLeave();
        }
    }

    private finalizeLeave() {
        this.socket?.emit('leave-interview', { roomId: this.roomId });
        this.router.navigate(['/']);
    }

    toggleAudio() {
        this.isAudioActive = !this.isAudioActive;
        this.localStream?.getAudioTracks().forEach(track => { track.enabled = this.isAudioActive; });
        this.socket?.emit('mic-toggle', { roomId: this.roomId, isAudioActive: this.isAudioActive });
    }

    toggleVideo() {
        this.isVideoActive = !this.isVideoActive;
        this.localStream?.getVideoTracks().forEach(t => t.enabled = this.isVideoActive);
        this.socket?.emit('camera-toggle', { roomId: this.roomId, isVideoActive: this.isVideoActive });
    }

    async toggleScreenShare() {
        if (!navigator.mediaDevices || !('getDisplayMedia' in navigator.mediaDevices)) {
            Swal.fire({
                title: 'Not Supported',
                text: 'Screen sharing is only supported on Desktop browsers.',
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000
            });
            return;
        }

        if (this.isSharingScreen) {
            this.isSharingScreen = false;
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(t => t.stop());
                const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                const videoTrack = this.localStream?.getVideoTracks()[0];
                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack);
                }
                this.screenStream = null;
            }
            if (this._localVideo?.nativeElement) this._localVideo.nativeElement.srcObject = this.localStream;
            this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: false });
        } else {
            try {
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' } as any,
                    audio: false
                });
                this.isSharingScreen = true;
                const screenTrack = this.screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(screenTrack);
                } else {
                    this.peerConnection.addTrack(screenTrack, this.screenStream);
                    this.socket?.emit('request-negotiation', { roomId: this.roomId });
                }
                if (this._localVideo?.nativeElement) {
                    this._localVideo.nativeElement.srcObject = this.screenStream;
                    this._localVideo.nativeElement.play().catch(() => {});
                }
                this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: true });
                screenTrack.onended = () => { if (this.isSharingScreen) this.toggleScreenShare(); };
            } catch (err) {
                console.error('[WebRTC] Screen share failed:', err);
                this.isSharingScreen = false;
            }
        }
        this.cdr.detectChanges();
    }

    toggleMaximize() {
        this.isRemoteMaximized = !this.isRemoteMaximized;
        this.cdr.detectChanges();
    }

    // ─── Editor & Chat ────────────────────────────────────────────────────────

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
        const currentUserId = this.authService.currentUser()?.id;
        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'You',
            senderId: currentUserId,
            text: this.newMessage.trim(),
            timestamp: new Date(),
            replyTo: this.replyingToMessage
        };
        this.chatMessages = [...this.chatMessages, msg];
        if (this.socket) {
            this.socket.emit('chat-message', { roomId: this.roomId, message: msg });
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

    runCode() {
        if (!this.code) return;
        this.isExecuting = true;
        this.executionResult = null;
        this.http.post<any>(`${environment.apiUrl}/interview/run`, {
            code: this.code,
            language: this.selectedLanguage
        }).subscribe({
            next: (res) => { this.isExecuting = false; this.executionResult = res; },
            error: () => {
                this.isExecuting = false;
                this.executionResult = { success: false, compile_error: 'Failed to run code.', output: '' };
            }
        });
    }

    public isCurrentUser(senderId: string | undefined): boolean {
        if (!senderId) return false;
        const currentUserId = this.authService.currentUser()?.id;
        if (!currentUserId) return false;
        return senderId.toString() === currentUserId.toString();
    }

    private scrollToBottom() {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }
}
