import { Component, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    registerForm: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    showPassword = false;
    showConfirmPassword = false;
    passwordStrength = 0;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        this.registerForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            ]],
            confirmPassword: ['', Validators.required],
            terms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });

        // Monitor password changes for strength
        this.registerForm.get('password')?.valueChanges.subscribe(value => {
            this.calculateStrength(value);
        });
    }

    get f() { return this.registerForm.controls; }

    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { mismatch: true };
    }

    calculateStrength(password: string) {
        let score = 0;
        if (!password) {
            this.passwordStrength = 0;
            return;
        }
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[@$!%*?&]/.test(password)) score += 1;
        this.passwordStrength = score; // 0-5
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;

        this.authService.register({
            username: this.registerForm.value.username,
            email: this.registerForm.value.email,
            password: this.registerForm.value.password
        }).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                // Since the backend now returns tokens, the AuthService should have intercepted them 
                // and saved them to localStorage if it's implemented like that.
                // Let's assume authService.register handles the session.

                Swal.fire({
                    icon: 'success',
                    title: 'Welcome to ThinkCode!',
                    text: 'Let\'s choose your learning plan.',
                    timer: 2000,
                    showConfirmButton: false
                });
                this.router.navigate(['/student/plans']);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.message || 'Registration failed';
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: this.errorMessage || undefined
                });
            }
        });
    }
}
