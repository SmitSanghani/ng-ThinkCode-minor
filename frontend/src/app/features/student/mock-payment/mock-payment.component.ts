import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mock-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mock-payment.component.html',
  styleUrls: ['./mock-payment.component.css']
})
export class MockPaymentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  cardName = '';
  cardNumber = '';
  phoneNumber = '';
  expiry = '';
  cvv = '';
  isProcessing = false;

  ngOnInit() {
    // Scroll to top
    window.scrollTo(0, 0);
  }

  processPayment() {
    this.isProcessing = true;

    // Simulate 2 second loading
    setTimeout(() => {
      this.http.post<any>(`${environment.apiUrl}/payment/select-premium`, {}).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            this.authService.currentUser.set(res.user);
          }
          Swal.fire({
            title: 'Payment Successful! 🎉',
            text: 'Welcome to Premium Plan!',
            icon: 'success',
            confirmButtonText: 'Great!',
            confirmButtonColor: '#6366f1'
          }).then(() => {
            const returnUrl = localStorage.getItem('paymentReturnUrl') || '/website/home';
            localStorage.removeItem('paymentReturnUrl');
            this.router.navigateByUrl(returnUrl);
          });
          this.isProcessing = false;
        },
        error: (err) => {
          this.isProcessing = false;
          Swal.fire('Error', 'Payment processing failed', 'error');
        }
      });
    }, 2000);
  }

  goBack() {
    this.router.navigate(['/student/plans']);
  }
}
