import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-create-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-events-page.html',
  styleUrls: ['./create-events-page.css'],
})
export class CreateEventsPage implements OnInit {
  auth = inject(Auth);
  router = inject(Router);
  modalService = inject(ModalService);
  eventService = inject(EventService);

  eventTitle = signal('');
  eventDate = signal('');
  eventTime = signal('');
  eventLocation = signal('');
  eventDescription = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) {
      this.modalService.openModal('login');
      return;
    }

    if (!user.emailVerified) {
      this.modalService.openModal('unverified-email');
    }
  }

  async createEvent() {
    const user = this.auth.currentUser

    if (!user) {
      this.modalService.openModal('login');
      return;
    }

    if (!user.emailVerified) {
      this.modalService.openModal('unverified-email');
      return;
    }

    const title = this.eventTitle();
    const date = this.eventDate();
    const time = this.eventTime();
    const location = this.eventLocation();
    const description = this.eventDescription();
    const creator = user.displayName || user.email || 'Unknown';

    if (!title || !date || !time || !location || !description) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.eventService.createEvent({
        title,
        date,
        time,
        location,
        description,
        creator
      });

      // Clear form
      this.eventTitle.set('');
      this.eventDate.set('');
      this.eventTime.set('');
      this.eventLocation.set('');
      this.eventDescription.set('');

      // Navigate to events page
      this.router.navigate(['/events']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create event');
      console.error('Error creating event:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
