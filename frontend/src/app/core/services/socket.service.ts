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
    private onlineStatusSubject = new BehaviorSubject<{ userId: string, isOnline: boolean } | null>(null);
    public onlineStatus$ = this.onlineStatusSubject.asObservable();

    constructor() {
        effect(() => {
            const user = this.authService.currentUser();
            if (user) {
                this.connect();
            } else {
                this.disconnect();
            }
        });
    }

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
            if (!this.socket) {
                // If not connected yet, periodically check or just wait
                const interval = setInterval(() => {
                    if (this.socket) {
                        this.socket.on(event, (data) => observer.next(data));
                        clearInterval(interval);
                    }
                }, 100);
                return () => clearInterval(interval);
            }
            this.socket.on(event, (data) => {
                this.zone.run(() => {
                    observer.next(data);
                });
            });
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

