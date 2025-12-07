import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ModalService } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class VerifiedUserGuard {
  auth = inject(Auth);
  router = inject(Router);
  modalService = inject(ModalService);

  canActivate(): boolean {
    const user = this.auth.currentUser;

    // No user logged in
    if (!user) {
      this.modalService.openModal('login');
      return false;
    }

    // User not verified
    if (!user.emailVerified) {
      this.modalService.openModal('unverified-email');
      return false;
    }

    // User is verified
    return true;
  }
}

/**
 * Functional guard for verified users - can be used in routing
 */
export const verifiedUserGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const modalService = inject(ModalService);

  const user = auth.currentUser;

  if (!user) {
    modalService.openModal('login');
    return false;
  }

  if (!user.emailVerified) {
    modalService.openModal('unverified-email');
    return false;
  }

  return true;
};
