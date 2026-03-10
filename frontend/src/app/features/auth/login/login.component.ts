import { Component, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    showPassword = false;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    ngOnInit() {
        this.authService.checkDetails().subscribe(isAuth => {
            if (isAuth) {
                this.redirectBasedOnRole();
            }
        });
    }

    private redirectBasedOnRole() {
        const role = this.authService.currentUser()?.role;
        if (role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/website/home']);
        }
    }

    get f() { return this.loginForm.controls; }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    onSubmit() {
        if (this.loginForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;

        this.authService.login(this.loginForm.value).subscribe({
            next: (res) => {
                this.isLoading = false;

                const role = res.user?.role;
                const welcomeMsg = role === 'admin' ? 'Welcome Dashboard' : 'Welcome Page';

                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: welcomeMsg,
                    timer: 1500,
                    showConfirmButton: false
                });

                // Clear fields
                this.loginForm.reset();

                // RBAC Redirect
                if (role === 'admin') {
                    this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
                } else {
                    this.router.navigate(['/website/home'], { replaceUrl: true });
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.message || 'Login failed';
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: this.errorMessage || undefined
                });
            }
        });
    }
}
