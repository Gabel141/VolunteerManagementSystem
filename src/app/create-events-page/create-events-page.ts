import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { EventService } from '../services/event.service';
import { UserService } from '../services/user.service';

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
  userService = inject(UserService);

  dateToday = new Date();

  eventTitle = signal('');
  eventDate = signal('');
  eventTime = signal('');
  eventLocation = signal('');
  eventLatitude = signal('');
  eventLongitude = signal('');
  eventWorkType = signal('');
  eventMemberCap = signal('');
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
    const date = new Date(this.eventDate());
    const time = this.eventTime();
    const location = this.eventLocation();
    const latitude = parseFloat(this.eventLatitude() || '') || undefined;
    const longitude = parseFloat(this.eventLongitude() || '') || undefined;
    const workType = this.eventWorkType();
    const memberCap = this.eventMemberCap() ? parseInt(this.eventMemberCap()) : undefined;
    const description = this.eventDescription();
    const creator = user.displayName || user.email || 'Unknown';

    if (date < this.dateToday) {
      this.errorMessage.set('Date has already passed!');
      return;
    }

    if (!title || !date || !time || !location || !description) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // try to include creator profile picture when creating the event
      let creatorProfilePicture: string | undefined = undefined;
      try {
        const profile = await this.userService.getCurrentUserProfile();
        if (profile && profile.profilePicture) creatorProfilePicture = profile.profilePicture;
      } catch (e) {
        // ignore
      }

      // Build event object, excluding undefined fields to avoid Firestore errors
      const eventData: any = {
        title,
        date,
        time,
        location,
        description,
        creator,
      };
      if (creatorProfilePicture) eventData.creatorProfilePicture = creatorProfilePicture;
      if (latitude !== undefined) eventData.latitude = latitude;
      if (longitude !== undefined) eventData.longitude = longitude;
      if (workType) eventData.workType = workType;
      if (memberCap !== undefined) eventData.memberCap = memberCap;

      await this.eventService.createEvent(eventData);

      // Clear form
      this.eventTitle.set('');
      this.eventDate.set('');
      this.eventTime.set('');
      this.eventLocation.set('');
      this.eventDescription.set('');
      this.eventMemberCap.set('');
      this.eventWorkType.set('');

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
