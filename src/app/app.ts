import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ModalService } from './services/modal.service';
import { CommonModule } from '@angular/common';
import { LoginModal } from './modals/login-modal/login-modal';
import { SignupModal } from './modals/signup-modal/signup-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, LoginModal, SignupModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  modalService = inject(ModalService);

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.authService.currentUserSig.set({
          email: user.email!,
          username: user.displayName!
        })
      }
      else {
        this.authService.currentUserSig.set(null);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  openLoginModal(): void {
    this.modalService.openModal('login');
  }

  openSignupModal(): void {
    this.modalService.openModal('signup');
  }
}
