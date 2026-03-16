import { Injectable, inject, effect, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private authService = inject(AuthService);
    private zone = inject(NgZone);
    private socket: Socket | null = null;
    
    // BUG 9: Global message subject to catch messages even when not in interview room
    private messageSubject = new BehaviorSubject<any>(null);
    public messages$ = this.messageSubject.asObservable();

    private onlineStatusSubject = new BehaviorSubject<{ userId: string, isOnline: boolean } | null>(null);
    public onlineStatus$ = this.onlineStatusSubject.asObservable();

    constructor() {}

    public connect() {
        if (this.socket?.connected) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const socketUrl = environment.apiUrl.replace('/api', '');
        console.log('Connecting to socket at:', socketUrl);
        this.socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'] // Ensure fallback
        });

        this.socket.on('connect', () => {
            this.zone.run(() => {
                console.log('Connected to Realtime Server');
            });
        });

        this.socket.on('statusUpdate', (data) => {
            this.zone.run(() => {
                this.onlineStatusSubject.next(data);
            });
        });

        // BUG 9: Global listener for 1-on-1 messages
        this.socket.on('receiveMessage', (data) => {
            this.zone.run(() => {
                console.log('Socket: Global message received', data);
                this.messageSubject.next(data);
            });
        });

        this.socket.on('disconnect', () => {
            this.zone.run(() => {
                console.log('Disconnected from Realtime Server');
            });
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string): Observable<any> {
        return new Observable(observer => {
            // BUG 8: Robust listener registration
            const register = (s: Socket) => {
                s.on(event, (data) => {
                    this.zone.run(() => observer.next(data));
                });
            };

            if (this.socket?.connected) {
                register(this.socket);
            } else {
                // Wait for socket to be ready without multiple intervals
                const check = setInterval(() => {
                    if (this.socket?.connected) {
                        register(this.socket);
                        clearInterval(check);
                    }
                }, 100);
                return () => clearInterval(check);
            }

            return () => this.socket?.off(event);
        });
    }

    emit(event: string, data: any) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            console.warn(`Attempted to emit ${event} before socket was ready`);
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

