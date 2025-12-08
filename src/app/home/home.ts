import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../services/modal.service';
import { UserGridComponent } from '../user-grid/user-grid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, UserGridComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  authService = inject(AuthService);
  router = inject(Router);
  modalService = inject(ModalService);

  navigateToEvents(): void {
    this.router.navigate(['/events']);
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/create-event']);
  }

  openLoginModal(): void {
    this.modalService.openModal('login');
  }

  openSignupModal(): void {
    this.modalService.openModal('signup');
  }

  isAuthenticated(): boolean {
    return this.authService.currentUserSig() !== null;
  }
}
