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
          <!-- Creator info and event title -->
          <div class="event-header d-flex align-items-start gap-3 mb-3">
            <a [routerLink]="['/profile', event.creatorUid]" class="d-inline-block flex-shrink-0">
              <img *ngIf="event.creatorProfilePicture" [src]="event.creatorProfilePicture" alt="{{ event.creator }}" class="rounded-circle" style="width:44px;height:44px;object-fit:cover;" />
              <div *ngIf="!event.creatorProfilePicture" class="avatar-placeholder-sm rounded-circle d-inline-flex align-items-center justify-content-center">{{ (event.creator || '?').charAt(0) }}</div>
            </a>
            <div class="flex-grow-1">
              <h5 class="card-title text-primary mb-2">{{ event.title }}</h5>
              <p class="card-text text-muted small mb-0">{{ (event.description || '') | slice:0:150 }}<span *ngIf="(event.description || '').length>150">…</span></p>
            </div>
          </div>

          <!-- Event metadata -->
          <div class="event-meta mb-3">
            <div class="row row-cols-1 row-cols-md-2 g-2">
              <div class="col">
                <small class="d-block text-muted">
                  <strong>📅 Date:</strong> {{ event.date }} at {{ event.time }}
                </small>
              </div>
              <div class="col">
                <small class="d-block text-muted">
                  <strong>📍 Location:</strong> {{ event.location }}
                </small>
              </div>
              <div class="col" *ngIf="event.workType">
                <small class="d-block text-muted">
                  <strong>🔧 Work:</strong> <span class="badge bg-secondary">{{ event.workType }}</span>
                </small>
              </div>
              <div class="col">
                <small class="d-block text-muted">
                  <strong>👥 Participants:</strong> {{ event.participants?.length || 0 }}<span *ngIf="event.memberCap"> / {{ event.memberCap }}</span>
                </small>
              </div>
              <div class="col">
                <small class="d-block text-muted">
                  <strong>👤 Creator:</strong> <a [routerLink]="['/profile', event.creatorUid]" class="text-decoration-none"> {{ event.creator }}</a>
                </small>
              </div>
              <!-- Map links removed: coordinates are no longer used in UI -->
            </div>
          </div>

          <!-- Action buttons -->
          <div *ngIf="currentUserUid" class="event-actions">
            <div class="d-flex flex-wrap gap-2 justify-content-end">
              <button
                class="btn btn-outline-primary btn-sm"
                [routerLink]="['/event-details', event.id]"
                type="button"
              >
                View Details
              </button>

              <button
                *ngIf="!isCreator(event)"
                (click)="onAttendClick(event)"
                [class.btn-success]="!isAttending(event)"
                [class.btn-danger]="isAttending(event)"
                class="btn btn-sm"
                type="button"
              >
                {{ isAttending(event) ? 'Leave Event' : 'Attend' }}
              </button>

              <button
                *ngIf="isCreator(event)"
                class="btn btn-warning btn-sm text-dark"
                [routerLink]="['/edit-event', event.id]"
                type="button"
              >
                Edit
              </button>
              <button
                *ngIf="isCreator(event)"
                (click)="onDeleteClick(event)"
                class="btn btn-danger btn-sm"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-card {
      border-left: 4px solid var(--sunlit-clay);
      border-radius: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
    }
    .event-header {
      flex-wrap: wrap;
    }
    .event-meta small {
      line-height: 1.6;
    }
    .event-meta a {
      color: var(--olive-leaf);
    }
    .event-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    .avatar-placeholder-sm {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--sunlit-clay), var(--copperwood));
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .btn-sm {
      font-size: 0.875rem;
      white-space: nowrap;
    }
    @media (max-width: 576px) {
      .event-header {
        flex-direction: column;
      }
      .event-actions {
        margin-top: 1rem;
      }
      .event-actions .d-flex {
        flex-direction: column;
      }
      .btn-sm {
        width: 100%;
      }
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
