import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { EventService, EventInterface } from '../services/event.service';
import { EventListComponent } from '../event-list/event-list';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EventListComponent],
  templateUrl: './events-page.html',
  styleUrls: ['./events-page.css'],
})
export class EventsPage implements OnInit {
  auth = inject(Auth);
  eventService = inject(EventService);
  modalService = inject(ModalService);

  events = signal<EventInterface[]>([]);
  filteredEvents = signal<EventInterface[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  attendingEventIds = signal<string[]>([]);
  currentUserUid: string | undefined;

  ngOnInit() {
    const user = this.auth.currentUser;
    this.currentUserUid = user?.uid;
    this.loadEvents();

    

  }

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (allEvents) => {
        this.events.set(allEvents);
        this.filterEvents();
        this.loadAttendingEventIds();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadAttendingEventIds() {
    if (!this.currentUserUid) {
      this.isLoading.set(false);
      return;
    }

    this.eventService.getEventsAttending().subscribe({
      next: (attendingEvents) => {
        this.attendingEventIds.set(attendingEvents.map(e => e.id || ''));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading attending events:', error);
        this.isLoading.set(false);
      }
    });
  }

  updateSearch(value: string) {
    this.searchTerm.set(value);
    this.filterEvents();
  }

  private filterEvents() {
    const query = this.searchTerm().toLowerCase().trim();
    if (!query) {
      this.filteredEvents.set(this.events());
      return;
    }

    const filtered = this.events().filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.creator.toLowerCase().includes(query)
    );

    this.filteredEvents.set(filtered);
  }

  async attendEvent(event: EventInterface) {
    if (!this.currentUserUid) {
      this.modalService.openModal('login');
      return;
    }

    try {
      if (!event.id) return;
      await this.eventService.joinEvent(event.id);
      this.loadAttendingEventIds();
    } catch (error) {
      console.error('Error attending event:', error);
      alert('Failed to attend event');
    }
  }

  async leaveEvent(event: EventInterface) {
    try {
      if (!event.id) return;
      await this.eventService.leaveEvent(event.id);
      this.loadAttendingEventIds();
    } catch (error) {
      console.error('Error leaving event:', error);
      alert('Failed to leave event');
    }
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
