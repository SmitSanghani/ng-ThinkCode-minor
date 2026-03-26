import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-black text-slate-900 mb-3">Update Password</h2>
          <p class="text-slate-500 text-sm">Please enter your old and new password details.</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Old Password -->
          <div class="space-y-2 relative">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-widest">Old Password</label>
            <div class="relative">
              <input [type]="showOld ? 'text' : 'password'" formControlName="oldPassword" 
                     class="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm"
                     placeholder="••••••••">
              <button type="button" (click)="showOld = !showOld" 
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i class="bi" [ngClass]="showOld ? 'bi-eye' : 'bi-eye-slash'"></i>
              </button>
            </div>
          </div>

          <!-- New Password -->
          <div class="space-y-2 relative">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-widest">New Password</label>
            <div class="relative">
              <input [type]="showNew ? 'text' : 'password'" formControlName="newPassword" 
                     class="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm"
                     placeholder="••••••••">
              <button type="button" (click)="showNew = !showNew" 
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i class="bi" [ngClass]="showNew ? 'bi-eye' : 'bi-eye-slash'"></i>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2 relative">
            <label class="text-xs font-bold text-slate-700 uppercase tracking-widest">Confirm New Password</label>
            <div class="relative">
              <input [type]="showConfirm ? 'text' : 'password'" formControlName="confirmPassword" 
                     class="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm"
                     placeholder="••••••••">
              <button type="button" (click)="showConfirm = !showConfirm" 
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i class="bi" [ngClass]="showConfirm ? 'bi-eye' : 'bi-eye-slash'"></i>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="resetForm.invalid || isLoading"
                  class="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer">
            {{ isLoading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>

        <div class="mt-8 text-center">
          <a routerLink="/login" class="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest cursor-pointer no-underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    button, a { cursor: pointer; }
    button:disabled { cursor: default; }
  `]
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;

  // Visibility toggles
  showOld = false;
  showNew = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.resetForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;

      const payload = {
        currentPassword: this.resetForm.value.oldPassword,
        newPassword: this.resetForm.value.newPassword
      };

      this.http.post<any>(`${environment.apiUrl}/auth/change-password`, payload).subscribe({
        next: (res) => {
          this.isLoading = false;
          Swal.fire({
            title: 'Success!',
            text: 'Your password has been updated securely.',
            icon: 'success',
            confirmButtonText: 'Back to Login',
            confirmButtonColor: '#2563eb',
            background: '#ffffff'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            title: 'Error!',
            text: err.error?.message || 'Failed to update password. Please check your credentials.',
            icon: 'error',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#ef4444'
          });
        }
      });
    }
  }
}
