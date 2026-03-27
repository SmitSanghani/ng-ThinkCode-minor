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
    senderId?: string; // Add this for robust comparison
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
    isRemoteSharing: boolean = false; // Track if peer is sharing

    private socket: any;
    private isNegotiating = false;
    private ignoreOffer = false;
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
            { urls: 'stun:stunserver.org' },
            { urls: 'stun:stun.ekiga.net' },
            { urls: 'stun:stun.ideasip.com' },
            { urls: 'stun:stun.schlund.de' },
            { urls: 'stun:stun.voiparound.com' },
            { urls: 'stun:stun.voipbuster.com' },
            { urls: 'stun:stun.voipstunt.com' },
            { urls: 'stun:stun.voxgratia.org' },
            { urls: 'stun:stun.services.mozilla.com' },
            // Public STUN from Metered
            { urls: 'stun:stun.metered.ca:80' },
            // Free TURN from open-relay
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
        // RESET STATES
        this.isAudioActive = true;
        this.isVideoActive = true;

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
            await this.initSocket();              // 1. connect socket
            this.setupSocketListeners();          // 2. attach all listeners

            // Get interview role
            const currentUserId = this.authService.currentUser()?.id;
            const interviewerId = this.interviewDetails?.interviewerId?._id || this.interviewDetails?.interviewerId;
            this.isInterviewer = interviewerId?.toString() === currentUserId?.toString();
            console.log('Interview: Is Interviewer?', this.isInterviewer);

            console.log('WebRTC: Accessing media...');
            await this.startLocalMedia();         // 3. get camera/mic

            console.log('WebRTC: Setting up WebRTC...');
            this.setupWebRTC();                   // 4. create RTCPeerConnection

            // Safety check for video binding every 2 seconds
            this.videoBindInterval = setInterval(() => this.ensureVideoBinding(), 2000);

            // 5. JOIN & HANDLE RECONNECTS
            console.log('Interview: Joining room...');
            this.joinInterviewRoom();

            // Re-join room if socket reconnects (CRITICAL for stability)
            this.socket.on('connect', () => {
                console.log('WebRTC: Socket reconnected, re-joining room...');
                this.joinInterviewRoom();
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
            this.isRemoteConnected = false;
            this.hasRemoteVideo = false;
            this.remoteHasVideo.set(false);
            this.remoteStream = null;
            if (this._remoteVideo?.nativeElement) {
                this._remoteVideo.nativeElement.srcObject = null;
            }
            this.cdr.markForCheck();
        });

        this.socket.on('user-joined', async (data: any) => {
            console.log(`WebRTC: User joined! UserID: ${data.userId}, Role: ${data.role}, Device: ${data.deviceInfo || 'Unknown'}`);
            this.isRemoteConnected = true;


            // Re-broadcast my status to the new joiner
            this.socket.emit('media-status', {
                roomId: this.roomId,
                isVideoActive: this.isVideoActive && this.localHasVideo(),
                isAudioActive: this.isAudioActive
            });

            // If I am Guest and Host (Interviewer) joins, I must request them to start negotiation
            const interviewerId = this.interviewDetails?.interviewerId?._id || this.interviewDetails?.interviewerId;
            if (!this.isInterviewer && data.userId === interviewerId?.toString()) {
                console.log('WebRTC: Host joined! Requesting negotiation...');
                this.socket.emit('request-negotiation', { roomId: this.roomId });
                return;
            }

            // If I am Host and someone (Guest) joins, I initiate negotiation
            if (this.isInterviewer) {
                this.initiateNegotiation();
            }
            this.cdr.detectChanges();
        });

        this.socket.on('request-negotiation', () => {
            console.log('WebRTC: Negotiation requested by peer');
            this.isRemoteConnected = true;
            if (this.isInterviewer) {
                this.initiateNegotiation();
            }
        });

        this.socket.on('webrtc-offer', async (data: any) => {
            console.log('WebRTC: Received offer, state:', this.peerConnection?.signalingState);
            this.isRemoteConnected = true;

            // Perfect Negotiation Pattern:
            const offerCollision = (data.offer.type === "offer") && 
                                   (this.isNegotiating || this.peerConnection?.signalingState !== "stable");
            
            this.ignoreOffer = !this.isInterviewer && offerCollision; // Candidate is polite, ignores collision
            if (this.ignoreOffer) {
                console.warn('WebRTC: Offer collision detected, ignoring because I am polite (Candidate)');
                return;
            }

            // CRITICAL: Wait for local media to be ready before answering (Max 2.5s)
            let attempts = 0;
            while (!this.localStream && attempts < 25) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!this.peerConnection) this.setupWebRTC();

            try {
                if (data.offer) {
                    data.offer.sdp = this.preferH264(data.offer.sdp);
                }
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                
                // Flush buffered candidates
                while (this.iceCandidatesBuffer.length > 0) {
                    const cand = this.iceCandidatesBuffer.shift();
                    if (cand) this.peerConnection.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }

                if (data.offer.type === "offer") {
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);
                    this.socket.emit('webrtc-answer', { roomId: this.roomId, answer });
                }
            } catch (err) {
                console.error("WebRTC: Error handling offer/answer", err);
            }
            this.cdr.detectChanges();
        });


        this.socket.on('webrtc-answer', async (data: any) => {
            console.log('WebRTC: Received answer, state:', this.peerConnection?.signalingState);
            this.isRemoteConnected = true;
            if (this.peerConnection && this.peerConnection.signalingState === 'have-local-offer') {
                if (data.answer) {
                    // Prefer H.264 for mobile compatibility (SDP Munging)
                    data.answer.sdp = this.preferH264(data.answer.sdp);
                }
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));


                // Flush buffered ICE candidates
                while (this.iceCandidatesBuffer.length > 0) {
                    const candidate = this.iceCandidatesBuffer.shift();
                    if (candidate) {
                        this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {
                            console.warn('WebRTC: Error adding buffered candidate', e);
                        });
                    }
                }
            } else {
                console.warn('WebRTC: PeerConnection in wrong state for answer:', this.peerConnection?.signalingState);
            }
            this.cdr.detectChanges();

        });

        this.socket.on('webrtc-candidate', async (data: any) => {
            if (this.peerConnection && data.candidate) {
                console.log('WebRTC Debug: Received ICE Candidate from Peer');
                this.isRemoteConnected = true;
                try {
                    if (this.peerConnection.remoteDescription) {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                        console.log('WebRTC Debug: ICE Candidate added successfully');
                    } else {
                        console.warn('WebRTC Debug: Remote description not set, buffering candidate');
                        this.iceCandidatesBuffer.push(data.candidate);
                    }
                } catch (e) {
                    console.error('WebRTC Debug: Error adding ICE candidate', e);
                }
                this.cdr.detectChanges();
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
                // Ensure sender name is 'You' if it's from me
                if (this.isCurrentUser(msg.senderId)) {
                    msg.sender = 'You';
                }
                this.chatMessages = [...this.chatMessages, msg];
                
                // If on mobile and chat is closed, show notification badge
                if (!this.isChatVisibleOnMobile() && !this.isCurrentUser(msg.senderId)) {
                    this.hasNewMessage.set(true);
                    console.log('Chat: New message badge active');
                }

                this.scrollToBottom();
                this.cdr.detectChanges();
            }
        });

        this.socket.on('roomChatHistory', (data: { roomId: string, messages: any[] }) => {
            console.log('Chat: Received room history', data);
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
            console.log('WebRTC: Peer media status update', data);
            this.isRemoteConnected = true;
            this.remoteHasVideo.set(data.isVideoActive);
            this.isRemoteAudioActive.set(data.isAudioActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-camera-toggled', ({ isVideoActive }: { isVideoActive: boolean }) => {
            console.log('WebRTC: Peer camera toggled:', isVideoActive);
            this.isRemoteConnected = true;
            this.remoteHasVideo.set(isVideoActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-mic-toggled', ({ isAudioActive }: { isAudioActive: boolean }) => {
            console.log('WebRTC: Peer mic toggled:', isAudioActive);
            this.isRemoteConnected = true;
            this.isRemoteAudioActive.set(isAudioActive);
            this.cdr.detectChanges();
        });

        this.socket.on('peer-screen-share', ({ isSharing }: { isSharing: boolean }) => {
            console.log('WebRTC: Peer screen share toggled:', isSharing);
            this.isRemoteSharing = isSharing;
            if (isSharing) {
                this.isRemoteMaximized = true;
                this.remoteHasVideo.set(true); // Ensure visibility when sharing starts
            }
            this.cdr.detectChanges();
        });

        this.socket.on('interview-ended', () => {
            console.log('WebRTC: Interview has been ended by Host');
            Swal.fire({
                title: 'Meeting Ended',
                text: 'This interview has been completed and the link has expired.',
                icon: 'info',
                confirmButtonText: 'OK'
            }).then(() => {
                this.finalizeLeave();
            });
        });
    }

    private ensureVideoBinding() {
        if (this._localVideo?.nativeElement) {
            const streamToBind = this.isSharingScreen ? this.screenStream : this.localStream;
            if (streamToBind && this._localVideo.nativeElement.srcObject !== streamToBind) {
                console.log('WebRTC: Refreshing local video binding');
                this._localVideo.nativeElement.srcObject = streamToBind;
                this._localVideo.nativeElement.muted = true;
            }
        }

        if (this._remoteVideo?.nativeElement && this.remoteStream) {
            const video = this._remoteVideo.nativeElement;
            
            // Check if track is actually active
            const tracks = this.remoteStream.getVideoTracks();
            const isTrackEnabled = tracks.length > 0 && tracks[0].enabled && tracks[0].readyState === 'live';

            if (isTrackEnabled) {
                // Force bind if srcObject is missing or mismatched
                if (video.srcObject !== this.remoteStream) {
                    console.log('WebRTC: Force binding remote stream to video element');
                    video.srcObject = this.remoteStream;
                }

                // Force play if paused
                if (video.paused && this.remoteHasVideo()) {
                    console.log('WebRTC: Attempting to play remote video...');
                    video.play().catch(e => {
                        console.warn('WebRTC: Remote play failed (user gesture required?)', e);
                    });
                }
            }
        }
        this.cdr.detectChanges();
    }


    ngOnDestroy() {
        if (this.videoBindInterval) clearInterval(this.videoBindInterval);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null as any;
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

    private joinInterviewRoom() {
        if (!this.socket?.connected) return;
        
        const deviceInfo = this.getDeviceInfo();
        console.log('Interview: Self joining room with device info:', deviceInfo);

        this.socket.emit('join-interview', { 
            roomId: this.roomId,
            deviceInfo: deviceInfo 
        });
        this.socket.emit('media-status', {
            roomId: this.roomId,
            isVideoActive: this.isVideoActive && this.localHasVideo(),
            isAudioActive: this.isAudioActive
        });
    }

    private getDeviceInfo(): string {
        const ua = navigator.userAgent;
        if (ua.indexOf("Win") != -1) return "Windows PC";
        if (ua.indexOf("Mac") != -1) return "Macintosh";
        if (ua.indexOf("Linux") != -1) return "Linux PC";
        if (ua.indexOf("Android") != -1) return "Android Phone";
        if (ua.indexOf("iPhone") != -1) return "iPhone";
        return "Unknown Device";
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

    public isCurrentUser(senderId: string | undefined): boolean {
        if (!senderId) return false;
        const currentUserId = this.authService.currentUser()?.id;
        if (!currentUserId) return false;
        return senderId.toString() === currentUserId.toString();
    }

    private async startLocalMedia() {
        try {
            console.log('WebRTC: Attempting to access media devices...');

            const constraints: any = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            };

            try {
                // 1. Try Video + Audio
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('WebRTC: Video + Audio access granted');
            } catch (videoError: any) {
                console.warn('WebRTC: Full media access failed, trying audio-only...', videoError.name);

                // 2. If video failed (missing hardware/denied), try Audio Only
                if (videoError.name === 'NotFoundError' || videoError.name === 'DevicesNotFoundError' || videoError.name === 'NotAllowedError') {
                    try {
                        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        this.isVideoActive = false; // Disable video state
                        console.log('WebRTC: Audio-only access granted (No Camera)');
                    } catch (audioError) {
                        throw new Error('Could not access microphone. Please check your hardware and permissions.');
                    }
                } else {
                    throw videoError;
                }
            }

            if (this._localVideo?.nativeElement) {
                this._localVideo.nativeElement.srcObject = this.localStream;
                this._localVideo.nativeElement.muted = true;
                if (this.isVideoActive) {
                    this._localVideo.nativeElement.play().catch(e => console.warn('Local video play failed:', e));
                }
            }

            this.addLocalTracksToPeer();
            this.localHasVideo.set(this.localStream.getVideoTracks().length > 0);
            console.log('WebRTC: Local media stream initialized');

        } catch (err: any) {
            console.error('WebRTC: Media error.', err);

            // Only show blocking error if even Audio fails
            if (err.message.includes('microphone')) {
                Swal.fire('Hardware Error', err.message, 'error');
            }
        }
    }

    private addLocalTracksToPeer() {
        if (!this.peerConnection || !this.localStream) return;
        const senders = this.peerConnection.getSenders();
        this.localStream.getTracks().forEach((track) => {
            const alreadyAdded = senders.some(s => s.track?.id === track.id);
            if (!alreadyAdded) {
                this.peerConnection.addTrack(track, this.localStream);
                console.log(`WebRTC: Added ${track.kind} track — enabled: ${track.enabled}`);
            }
        });

        // Verify active tracks
        const kinds = this.peerConnection.getSenders().map(s => s.track?.kind);
        console.log('WebRTC: Active sender tracks:', kinds);
    }

    private setupWebRTC() {
        if (this.peerConnection) return;
        console.log('WebRTC: Creating RTCPeerConnection...');

        this.peerConnection = new RTCPeerConnection(this.iceServers);

        // Proactive Transceivers (Essential for mobile/safari)
        this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
        this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

        this.peerConnection.ontrack = (event) => {
            console.log('WebRTC: Received Remote Track:', event.track.kind, 'ReadyState:', event.track.readyState);
            
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }

            // Always add the track to our existing stream object instead of replacing the entire stream
            // This prevents broken references in the video element
            const existingTracks = this.remoteStream.getTracks();
            if (!existingTracks.find(t => t.id === event.track.id)) {
                this.remoteStream.addTrack(event.track);
            }

            if (event.track.kind === 'video') {
                this.hasRemoteVideo = true;
                this.remoteHasVideo.set(true);
                this.isRemoteConnected = true;
                
                event.track.onmute = () => {
                    console.log('WebRTC Track: Track Muted (Network issue or Peer closed camera)');
                    this.remoteHasVideo.set(false);
                };
                event.track.onunmute = () => {
                    console.log('WebRTC Track: Track Unmuted');
                    this.remoteHasVideo.set(true);
                };

                // Immediate binding attempt
                setTimeout(() => this.ensureVideoBinding(), 100);
            }


            if (event.track.kind === 'audio') {
                this.isRemoteAudioActive.set(true);
            }

            // Forced re-bind to video element
            this.ensureVideoBinding();
            this.cdr.detectChanges();
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('WebRTC ICE State:', this.peerConnection.iceConnectionState);
            if (this.peerConnection.iceConnectionState === 'failed') {
                this.peerConnection.restartIce();
            }
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket?.emit('webrtc-candidate', { roomId: this.roomId, candidate: event.candidate });
            }
        };

        // Always add local tracks if we have them
        this.addLocalTracksToPeer();
    }

    private initiateNegotiation() {
        if (!this.peerConnection || this.isNegotiating) return;

        this.isNegotiating = true;
        setTimeout(async () => {
            try {
                // Perfect Negotiation: If not stable, we wait
                if (this.peerConnection.signalingState !== 'stable') {
                    this.isNegotiating = false;
                    return;
                }

                console.log('WebRTC: Creating proactive offer...');
                const offer = await this.peerConnection.createOffer();
                
                // SDP Munging
                offer.sdp = this.preferH264(offer.sdp!);

                await this.peerConnection.setLocalDescription(offer);
                this.socket.emit('webrtc-offer', { roomId: this.roomId, offer: this.peerConnection.localDescription });
            } catch (err) {
                console.error('WebRTC: Proactive offer error', err);
            } finally {
                // Short wait to prevent spamming offers
                setTimeout(() => this.isNegotiating = false, 1000);
            }
        }, 1000);
    }

    // Helper to prioritize H.264 video codec in SDP
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

        // Move H264 payloads to the front of the m=video line
        const newMLine = mLine.slice(0, 3);
        const otherPayloads = mLine.slice(3).filter(p => !h264Payloads.includes(p));
        
        // Final line construction
        lines[videoIndex] = [...newMLine, ...h264Payloads, ...otherPayloads].join(' ');
        return lines.join('\r\n');
    }


    toggleAudio() {
        this.isAudioActive = !this.isAudioActive;
        this.localStream?.getAudioTracks().forEach(track => {
            track.enabled = this.isAudioActive;
            console.log(`Audio track enabled: ${track.enabled}`);
        });
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
                text: 'Screen sharing is typically only supported on Desktop browsers (Chrome/Edge/Safari/Firefox).',
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000
            });
            return;
        }

        if (this.isSharingScreen) {
            // Stop sharing
            this.isSharingScreen = false;
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(t => t.stop());

                const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                const videoTrack = this.localStream?.getVideoTracks()[0];

                if (sender) {
                    if (videoTrack) {
                        await sender.replaceTrack(videoTrack);
                    } else {
                        // If we didn't have a camera originally, we added this track just for sharing
                        try {
                            this.peerConnection.removeTrack(sender);
                            this.socket?.emit('request-negotiation', { roomId: this.roomId });
                        } catch (e) {
                            console.warn('WebRTC: Error removing screen track', e);
                        }
                    }
                }
                this.screenStream = null;
            }

            if (this._localVideo?.nativeElement) this._localVideo.nativeElement.srcObject = this.localStream;
            this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: false });
        } else {
            try {
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" } as any,
                    audio: false
                });
                this.isSharingScreen = true;
                const screenTrack = this.screenStream.getVideoTracks()[0];

                // Try to find existing video sender
                let sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');

                if (sender) {
                    await sender.replaceTrack(screenTrack);
                    console.log('WebRTC: Replaced existing track with screen share');
                } else {
                    console.log('WebRTC: No existing video sender, adding screen track');
                    this.peerConnection.addTrack(screenTrack, this.screenStream);
                    // MUST renegotiate because we added a new track kind
                    this.socket?.emit('request-negotiation', { roomId: this.roomId });
                }

                if (this._localVideo?.nativeElement) {
                    this._localVideo.nativeElement.srcObject = this.screenStream;
                    this._localVideo.nativeElement.play().catch(() => { });
                }
                this.socket?.emit('screen-share-status', { roomId: this.roomId, isSharing: true });

                screenTrack.onended = () => {
                    if (this.isSharingScreen) this.toggleScreenShare();
                };
            } catch (err) {
                console.error('WebRTC: Screen share failed', err);
                this.isSharingScreen = false;
            }
        }
        this.cdr.detectChanges();
    }

    toggleMaximize() {
        this.isRemoteMaximized = !this.isRemoteMaximized;
        this.cdr.detectChanges();
    }
}
