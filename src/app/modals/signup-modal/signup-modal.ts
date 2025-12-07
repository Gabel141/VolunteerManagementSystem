import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FirebaseErrorService } from '../../services/firebase-error.service';

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup-modal.html',
  styleUrls: ['./signup-modal.css'],
})
export class SignupModal {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);
  modalService = inject(ModalService);
  errorService = inject(FirebaseErrorService);

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  onSubmit(): void {
    if (!this.form.valid) {
      this.errorMessage = 'Please fill in all fields correctly.';
      this.successMessage = null;
      return;
    }

    const { username, email, password, confirmPassword } = this.form.getRawValue();

    // Debug logging
    console.log('=== SIGNUP MODAL SUBMISSION ===');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 0);
    console.log('Password (raw from form):', password);
    console.log('Confirm Password:', confirmPassword);
    console.log('Passwords match:', password === confirmPassword);

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.successMessage = null;
      return;
    }

    // Log the exact value being sent to AuthService
    console.log('Sending to AuthService.register() with password:', password, 'Length:', password.length);

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.register(email, username, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created! Please check your email to verify your account.';
        this.form.reset();

        // After 2 seconds, switch to login modal
        setTimeout(() => {
          this.modalService.closeModal('signup');
          this.modalService.openModal('login');
          this.successMessage = null;
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Signup error received in SignupModal:', err);
        this.errorMessage = this.errorService.getErrorMessage(err);
        this.successMessage = null;
      },
    });
  }

  openLoginModal(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.form.reset();
    this.modalService.closeModal('signup');
    this.modalService.openModal('login');
  }

  closeModal(): void {
    this.modalService.closeModal('signup');
    this.errorMessage = null;
    this.successMessage = null;
    this.form.reset();
  }

  isModalOpen(): boolean {
    return this.modalService.isOpen('signup');
  }
}
