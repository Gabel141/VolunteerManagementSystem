import { Component, inject, signal, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ModalService } from './services/modal.service';
import { CommonModule } from '@angular/common';
import { LoginModal } from './modals/login-modal/login-modal';
import { SignupModal } from './modals/signup-modal/signup-modal';
import { UnverifiedEmailModal } from './modals/unverified-email-modal/unverified-email-modal';
import { Auth } from '@angular/fire/auth';
import { UserService } from './services/user.service';
import { Firestore, onSnapshot, doc } from '@angular/fire/firestore';


@Component({
  selector: 'app-root',
  standalone: true,
  // UnverifiedEmailModal is used in app.html template
  imports: [RouterModule, CommonModule, LoginModal, SignupModal, UnverifiedEmailModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  modalService = inject(ModalService);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private firestore = inject(Firestore);

  currentUserProfile = signal<{ displayName?: string; profilePicture?: string } | null>(null);
  sidebarOpen = signal(false);
  private unsubscribeProfile: (() => void) | null = null;

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.authService.currentUserSig.set({
          email: user.email!,
          username: user.displayName!
        })

        // Set up real-time listener for profile changes
        if (this.unsubscribeProfile) {
          this.unsubscribeProfile();
        }

        const userDocRef = doc(this.firestore, 'users', user.uid);
        this.unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            this.currentUserProfile.set({
              displayName: data['displayName'],
              profilePicture: data['profilePicture']
            });
          }
        }, (error) => {
          console.error('Error listening to profile changes:', error);
        });
      }
      else {
        this.authService.currentUserSig.set(null);
        this.currentUserProfile.set(null);
        if (this.unsubscribeProfile) {
          this.unsubscribeProfile();
          this.unsubscribeProfile = null;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.closeSidebar();
    this.authService.logout();
  }

  openLoginModal(): void {
    this.modalService.openModal('login');
  }

  openSignupModal(): void {
    this.modalService.openModal('signup');
  }

  getCurrentUserUid(): string | undefined {
    return this.auth.currentUser?.uid;
  }
}
