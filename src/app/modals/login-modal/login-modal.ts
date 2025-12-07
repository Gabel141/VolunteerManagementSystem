import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FirebaseErrorService } from '../../services/firebase-error.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-modal.html',
  styleUrls: ['./login-modal.css'],
})
export class LoginModal {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);
  modalService = inject(ModalService);
  errorService = inject(FirebaseErrorService);

  errorMessage: string | null = null;
  isLoading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (!this.form.valid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalService.closeModal('login');
        this.router.navigateByUrl('/');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = this.errorService.getErrorMessage(err);
      },
    });
  }

  openSignupModal(): void {
    this.errorMessage = null;
    this.form.reset();
    this.modalService.closeModal('login');
    this.modalService.openModal('signup');
  }

  closeModal(): void {
    this.modalService.closeModal('login');
    this.errorMessage = null;
    this.form.reset();
  }

  isModalOpen(): boolean {
    return this.modalService.isOpen('login');
  }
}
