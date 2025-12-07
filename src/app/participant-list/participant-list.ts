import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Participant {
  uid: string;
  displayName: string;
  email: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="participant-list-container">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h6 class="mb-0">👥 Participants ({{ participants.length }})</h6>
        </div>
        <div class="card-body p-0">
          <div *ngIf="participants.length === 0" class="p-3">
            <p class="text-muted mb-0">No participants yet.</p>
          </div>

          <div *ngIf="participants.length > 0">
            <ul class="list-group list-group-flush">
              <li *ngFor="let participant of participants" class="list-group-item participant-item">
                <div class="d-flex align-items-center">
                  <div class="participant-avatar me-3">
                    <img
                      *ngIf="participant.profilePicture"
                      [src]="participant.profilePicture"
                      alt="{{ participant.displayName }}"
                      class="rounded-circle"
                    />
                    <div
                      *ngIf="!participant.profilePicture"
                      class="avatar-placeholder rounded-circle"
                    >
                      {{ participant.displayName.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-1">
                      <strong>{{ participant.displayName }}</strong>
                    </p>
                    <small class="text-muted">{{ participant.email }}</small>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-list-container {
      margin-top: 20px;
    }

    .participant-item {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .participant-item:last-child {
      border-bottom: none;
    }

    .participant-item:hover {
      background-color: #f8f9fa;
    }

    .participant-avatar {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .participant-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
    }
  `]
})
export class ParticipantListComponent {
  @Input() participants: Participant[] = [];
}
