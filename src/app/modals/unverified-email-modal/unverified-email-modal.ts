import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FirebaseErrorService } from '../../services/firebase-error.service';

@Component({
  selector: 'app-unverified-email-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-warning">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title">⚠️ Email Not Verified</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">
              Your email address has not been verified yet. Please verify your email to access all features.
            </p>
            <p class="text-muted mb-4">
              Check your inbox for a verification email. If you don't see it, you can request a new one below.
            </p>
            <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
              {{ errorMessage }}
            </div>
            <div *ngIf="successMessage" class="alert alert-success" role="alert">
              {{ successMessage }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Close</button>
            <button
              type="button"
              class="btn btn-warning text-dark"
              (click)="resendVerification()"
              [disabled]="isLoading"
            >
              <span *ngIf="!isLoading">Resend Verification Email</span>
              <span *ngIf="isLoading">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="isOpen" *ngIf="isOpen"></div>
  `,
  styles: [`
    .modal.show {
      display: block;
    }
  `]
})
export class UnverifiedEmailModal {
  authService = inject(AuthService);
  modalService = inject(ModalService);
  errorService = inject(FirebaseErrorService);

  isOpen = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    // Subscribe to modal state
    setInterval(() => {
      this.isOpen = this.modalService.isOpen('unverified-email');
    }, 100);
  }

  closeModal() {
    this.errorMessage = '';
    this.successMessage = '';
    this.modalService.closeModal('unverified-email');
  }

  resendVerification() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendVerificationEmail().subscribe({
      next: () => {
        this.successMessage = '✅ Verification email sent! Check your inbox.';
        this.isLoading = false;
        setTimeout(() => this.closeModal(), 3000);
      },
      error: (error: any) => {
        this.errorMessage = this.errorService.getErrorMessage(error);
        this.isLoading = false;
      }
    });
  }
}
