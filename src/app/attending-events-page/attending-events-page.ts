import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { EventService, EventInterface } from '../services/event.service';
import { ModalService } from '../services/modal.service';
import { EventListComponent } from '../event-list/event-list';

@Component({
  selector: 'app-attending-events',
  standalone: true,
  imports: [CommonModule, RouterModule, EventListComponent],
  template: `
    <div class="container mt-5">
      <div class="mb-4">
        <h2 class="text-primary mb-3">🎉 Events I'm Attending</h2>
        <p class="text-muted">Events you have signed up for</p>
      </div>

      <div *ngIf="!isVerified" class="alert alert-warning" role="alert">
        <strong>⚠️ Email Not Verified</strong>
        <p class="mb-0">Please verify your email to attend events.</p>
      </div>

      <div *ngIf="isLoading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading your events...</p>
      </div>

      <div *ngIf="!isLoading() && attendingEvents().length === 0 && isVerified" class="text-center py-5">
        <div class="mb-4">
          <span style="font-size: 3rem;">🔍</span>
        </div>
        <h4 class="text-muted">No Events Yet</h4>
        <p class="text-muted mb-4">You haven't joined any events yet. Explore and find events that match your interests!</p>
        <button class="btn btn-primary btn-lg" routerLink="/events">
          👀 Browse Events
        </button>
      </div>

      <app-event-list
        *ngIf="!isLoading() && attendingEvents().length > 0"
        [events]="attendingEvents()"
        [currentUserUid]="currentUserUid"
        [attendingEventIds]="attendingEventIds()"
        [emptyMessage]="'You are not attending any events yet.'"
        [onLeave]="leaveEvent.bind(this)"
      ></app-event-list>

      <div class="mt-4">
        <button class="btn btn-primary" routerLink="/events">
          ← Browse All Events
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AttendingEventsPage implements OnInit {
  auth = inject(Auth);
  eventService = inject(EventService);
  modalService = inject(ModalService);

  attendingEvents = signal<EventInterface[]>([]);
  attendingEventIds = signal<string[]>([]);
  isLoading = signal(true);
  isVerified = false;
  currentUserUid: string | undefined;

  ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) {
      this.modalService.openModal('login');
      return;
    }

    this.isVerified = user.emailVerified;
    this.currentUserUid = user.uid;

    if (!this.isVerified) {
      this.isLoading.set(false);
      return;
    }

    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEventsAttending().subscribe({
      next: (events) => {
        this.attendingEvents.set(events);
        this.attendingEventIds.set(events.map(e => e.id || ''));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading attending events:', error);
        this.isLoading.set(false);
      }
    });
  }

  async leaveEvent(event: EventInterface) {
    try {
      if (!event.id) return;
      await this.eventService.leaveEvent(event.id);
      this.loadEvents();
    } catch (error) {
      console.error('Error leaving event:', error);
      alert('Failed to leave event');
    }
  }
}
