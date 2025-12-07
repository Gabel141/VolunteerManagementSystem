import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventInterface } from '../services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="event-list-container">
      <div *ngIf="events.length === 0" class="alert alert-info">
        <p class="mb-0">{{ emptyMessage || 'No events found.' }}</p>
      </div>

      <div *ngFor="let event of events" class="card event-card mb-3 shadow-sm">
        <div class="card-body">
          <div class="row">
            <div class="col-md-8 d-flex align-items-start gap-3">
              <a [routerLink]="['/profile', event.creatorUid]\" class=\"d-inline-block\">
                <div class=\"avatar-placeholder-sm rounded-circle d-inline-flex align-items-center justify-content-center\">{{ (event.creator || '?').charAt(0) }}</div>
              </a>
              <div>
                <h5 class="card-title text-primary">{{ event.title }}</h5>
              <p class="card-text text-muted">{{ event.description }}</p>
              <div class="event-meta">
                <small class="d-block">
                  <strong>📅 Date:</strong> {{ event.date }} at {{ event.time }}
                </small>
                <small class="d-block">
                  <strong>📍 Location:</strong> {{ event.location }}
                </small>
                <small class="d-block">
                  <strong>👤 Creator:</strong> <a [routerLink]="['/profile', event.creatorUid]">{{ event.creator }}</a>
                  <span *ngIf="event.creatorEmail" class="text-muted">({{ event.creatorEmail }})</span>
                </small>
                <small class="d-block">
                  <strong>👥 Participants:</strong> {{ event.participants?.length || 0 }}
                </small>
              </div>
            </div>
            <div class="col-md-4 d-flex align-items-center justify-content-end">
              <div class="btn-group-vertical w-100" role="group">
                <button
                  class="btn btn-outline-primary btn-sm"
                  [routerLink]="['/event-details', event.id]"
                >
                  View Details
                </button>
                <button
                  *ngIf="!isCreator(event)"
                  (click)="onAttendClick(event)"
                  [class.btn-success]="!isAttending(event)"
                  [class.btn-danger]="isAttending(event)"
                  class="btn btn-sm"
                >
                  {{ isAttending(event) ? 'Leave Event' : 'Attend' }}
                </button>
                <button
                  *ngIf="isCreator(event)"
                  class="btn btn-warning btn-sm text-dark"
                  [routerLink]="['/edit-event', event.id]"
                >
                  Edit
                </button>
                <button
                  *ngIf="isCreator(event)"
                  (click)="onDeleteClick(event)"
                  class="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-card {
      border-left: 4px solid #007bff;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .event-meta {
      margin-top: 10px;
    }
    .event-meta small {
      line-height: 1.8;
    }
    .btn-group-vertical {
      gap: 5px;
    }
  `]
})
export class EventListComponent {
  @Input() events: EventInterface[] = [];
  @Input() emptyMessage = 'No events found.';
  @Input() currentUserUid?: string;
  @Input() attendingEventIds?: string[];
  @Input() onAttend?: (event: EventInterface) => void;
  @Input() onLeave?: (event: EventInterface) => void;
  @Input() onDelete?: (event: EventInterface) => void;

  isCreator(event: EventInterface): boolean {
    return event.creatorUid === this.currentUserUid;
  }

  isAttending(event: EventInterface): boolean {
    return this.attendingEventIds?.includes(event.id || '') || false;
  }

  onAttendClick(event: EventInterface) {
    if (this.isAttending(event)) {
      this.onLeave?.(event);
    } else {
      this.onAttend?.(event);
    }
  }

  onDeleteClick(event: EventInterface) {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.onDelete?.(event);
    }
  }
}
