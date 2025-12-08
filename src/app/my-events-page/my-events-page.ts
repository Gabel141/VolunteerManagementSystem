import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { EventService, EventInterface } from '../services/event.service';
import { ModalService } from '../services/modal.service';
import { EventListComponent } from '../event-list/event-list';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterModule, EventListComponent],
  template: `
    <div class="container mt-5">
      <div class="mb-4">
        <h2 class="text-primary mb-3">📋 My Events</h2>
        <p class="text-muted">Events you are organizing</p>
      </div>

      <div *ngIf="!isVerified" class="alert alert-warning" role="alert">
        <strong>⚠️ Email Not Verified</strong>
        <p class="mb-0">Please verify your email to manage your events.</p>
      </div>

      <div *ngIf="isLoading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading your events...</p>
      </div>

      <div *ngIf="!isLoading() && myEvents().length === 0 && isVerified" class="text-center py-5">
        <div class="mb-4">
          <span style="font-size: 3rem;">📭</span>
        </div>
        <h4 class="text-muted">No Events Yet</h4>
        <p class="text-muted mb-4">You haven't created any events. Start by creating your first volunteer event!</p>
        <button class="btn btn-primary btn-lg" routerLink="/create-event">
          ➕ Create Your First Event
        </button>
      </div>

      <app-event-list
        *ngIf="!isLoading() && myEvents().length > 0"
        [events]="myEvents()"
        [currentUserUid]="currentUserUid"
        [attendingEventIds]="attendingEventIds()"
        [emptyMessage]="'You are not organizing any events yet.'"
        [onDelete]="deleteEvent.bind(this)"
      ></app-event-list>

      <div class="mt-4">
        <button class="btn btn-primary" routerLink="/create-event">
          ➕ Create New Event
        </button>
        <button class="btn btn-secondary ms-2" routerLink="/events">
          ← Back to All Events
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class MyEventsPage implements OnInit {
  auth = inject(Auth);
  eventService = inject(EventService);
  modalService = inject(ModalService);
  router = inject(Router);

  myEvents = signal<EventInterface[]>([]);
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
    // Get events created by the user
    this.eventService.getMyEvents().subscribe({
      next: (events) => {
        this.myEvents.set(events);
        // Load attending event IDs after my events
        this.loadAttendingEventIds();
      },
      error: (error) => {
        console.error('Error loading my events:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadAttendingEventIds() {
    // Get all events to find which ones this user is attending (excluding ones they created)
    this.eventService.getEventsAttending().subscribe({
      next: (events) => {
        this.attendingEventIds.set(events.map(e => e.id || ''));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading attending events:', error);
        // Still mark as loaded even if error occurs
        this.isLoading.set(false);
      }
    });
  }

  async deleteEvent(event: EventInterface) {
    try {
      if (!event.id) return;
      await this.eventService.deleteEvent(event.id);
      this.loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  }
}
