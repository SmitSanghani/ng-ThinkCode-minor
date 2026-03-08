import { Injectable, inject, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private authService = inject(AuthService);
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

    private connect() {
        if (this.socket?.connected) return;

        const token = sessionStorage.getItem('accessToken');
        if (!token) return;

        const socketUrl = environment.apiUrl.replace('/api', '');
        this.socket = io(socketUrl, {
            auth: { token }
        });

        this.socket.on('connect', () => {
            console.log('Connected to Realtime Server');
        });

        this.socket.on('statusUpdate', (data) => {
            this.onlineStatusSubject.next(data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Realtime Server');
        });
    }

    private disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string): Observable<any> {
        return new Observable(observer => {
            this.socket?.on(event, (data) => observer.next(data));
        });
    }
}
