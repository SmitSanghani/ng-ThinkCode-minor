import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-plans',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    templateUrl: './plans.component.html',
    styleUrls: ['./plans.component.css']
})
export class PlansComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);

    isProcessing = false;

    ngOnInit() {
        // Check for payment callback params
        this.route.queryParams.subscribe(params => {
            if (params['payment'] === 'success' && params['session_id']) {
                this.verifyPayment(params['session_id']);
            } else if (params['payment'] === 'cancelled') {
                Swal.fire({
                    title: 'Payment Cancelled',
                    text: 'You can try again or start with the Free plan.',
                    icon: 'info',
                    confirmButtonColor: '#2563eb'
                });
            }
        });
    }

    selectPlan(plan: 'Free' | 'Premium') {
        if (this.isProcessing) return;
        this.isProcessing = true;

        if (plan === 'Free') {
            // No payment, just activate Free plan
            this.http.post<any>('/api/payment/select-free', {}).subscribe({
                next: (res) => {
                    if (res.success && res.user) {
                        this.authService.currentUser.set(res.user);
                    }
                    Swal.fire({
                        title: 'Free Plan Activated! 🎉',
                        text: 'You can start solving problems right away.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        this.router.navigate(['/student/problems']);
                    });
                    this.isProcessing = false;
                },
                error: (err) => {
                    this.isProcessing = false;
                    Swal.fire('Error', err.message || 'Something went wrong', 'error');
                }
            });
        } else {
            // Premium — redirect to Stripe Checkout
            this.http.post<any>('/api/payment/create-checkout-session', {}).subscribe({
                next: (res) => {
                    if (res.success && res.url) {
                        // Redirect to Stripe hosted checkout page
                        window.location.href = res.url;
                    }
                    this.isProcessing = false;
                },
                error: (err) => {
                    this.isProcessing = false;
                    Swal.fire('Error', err.error?.message || 'Could not start checkout', 'error');
                }
            });
        }
    }

    private verifyPayment(sessionId: string) {
        this.isProcessing = true;

        this.http.post<any>('/api/payment/verify', { sessionId }).subscribe({
            next: (res) => {
                if (res.success && res.user) {
                    this.authService.currentUser.set(res.user);
                }
                Swal.fire({
                    title: 'Payment Successful! 🎉',
                    text: 'Welcome to Premium! Enjoy unlimited access.',
                    icon: 'success',
                    confirmButtonText: 'Start Coding',
                    confirmButtonColor: '#2563eb'
                }).then(() => {
                    this.router.navigate(['/student/problems']);
                });
                this.isProcessing = false;
            },
            error: (err) => {
                this.isProcessing = false;
                Swal.fire('Verification Failed', err.error?.message || 'Could not verify payment', 'error');
            }
        });
    }
}
