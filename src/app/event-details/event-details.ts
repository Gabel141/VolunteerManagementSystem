import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { EventService, EventInterface } from '../services/event.service';
import { UserService } from '../services/user.service';
import { ModalService } from '../services/modal.service';
import { ParticipantListComponent, Participant } from '../participant-list/participant-list';
import { EventChatComponent } from '../event-chat/event-chat';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, ParticipantListComponent, EventChatComponent],
  templateUrl: './event-details.html',
  styleUrls: ['./event-details.css'],
})
export class EventDetails implements OnInit {
  auth = inject(Auth);
  eventService = inject(EventService);
  userService = inject(UserService);
  modalService = inject(ModalService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  event = signal<EventInterface | null>(null);
  creatorProfile: { displayName?: string; profilePicture?: string } | null = null;
  participants = signal<Participant[]>([]);
  loading = signal(true);
  error = signal('');
  isCreator = signal(false);
  isAttending = signal(false);
  isActionLoading = signal(false);
  currentUserUid: string | undefined;
  // Map functionality removed; coordinates still stored in DB but not used in UI

  ngOnInit() {
    const user = this.auth.currentUser;
    this.currentUserUid = user?.uid;

    if (!user?.emailVerified) {
      this.modalService.openModal('unverified-email');
    }

    this.route.params.subscribe(params => {
      const eventId = params['id'];
      if (eventId) {
        this.loadEvent(eventId);
      }
    });
  }

  ngOnDestroy() {
    // no-op (map removed)
  }

  async loadEvent(eventId: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const loadedEvent = await this.eventService.getEvent(eventId);
      if (loadedEvent) {
        this.event.set(loadedEvent);
        this.isCreator.set(loadedEvent.creatorUid === this.currentUserUid);
        this.isAttending.set(loadedEvent.participants?.includes(this.currentUserUid || '') || false);
        // load creator profile picture if available
        try {
          const profile = await this.userService.getUserByUid(loadedEvent.creatorUid);
          if (profile) {
            this.creatorProfile = { displayName: profile.displayName, profilePicture: profile.profilePicture };
          }
        } catch (e) {
          console.warn('Failed to load creator profile', e);
        }
        await this.loadParticipants(eventId);
        // Coordinates present in event are preserved in the data model but map previews were removed
      } else {
        this.error.set('Event not found.');
      }
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to load event.');
    } finally {
      this.loading.set(false);
    }
  }

  // initializeMap removed

  async loadParticipants(eventId: string): Promise<void> {
    try {
      const participantsList = await this.eventService.getParticipants(eventId);
      this.participants.set(participantsList);
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  }

  async joinEvent(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent?.id) return;

    this.isActionLoading.set(true);
    try {
      await this.eventService.joinEvent(currentEvent.id);
      this.isAttending.set(true);
      await this.loadEvent(currentEvent.id);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to join event');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  isEventFull(): boolean {
    const currentEvent = this.event();
    if (!currentEvent || !currentEvent.memberCap || !currentEvent.participants) {
      return false;
    }
    return currentEvent.participants.length >= currentEvent.memberCap;
  }

  getParticipantCountText(): string {
    const currentEvent = this.event();
    if (!currentEvent) return '';

    const count = currentEvent.participants?.length || 0;
    if (currentEvent.memberCap) {
      return `${count} / ${currentEvent.memberCap}`;
    }
    return `${count}`;
  }

  async leaveEvent(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent?.id) return;

    this.isActionLoading.set(true);
    try {
      await this.eventService.leaveEvent(currentEvent.id);
      this.isAttending.set(false);
      await this.loadEvent(currentEvent.id);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to leave event');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  async deleteEvent(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent?.id) return;

    if (!confirm(`Are you sure you want to delete "${currentEvent.title}"?`)) {
      return;
    }

    this.isActionLoading.set(true);
    try {
      await this.eventService.deleteEvent(currentEvent.id);
      this.router.navigate(['/events']);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to delete event');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  editEvent(): void {
    const currentEvent = this.event();
    if (currentEvent?.id) {
      this.router.navigate(['/edit-event', currentEvent.id]);
    }
  }
}
