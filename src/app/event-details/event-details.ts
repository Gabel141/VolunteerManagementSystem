import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './event-details.html',
  styleUrls: ['./event-details.css'],
})
export class EventDetails implements OnInit {
  event: any = null;
  loading = true;
  error = '';
  profilePicture = '';
  displayName = '';

  constructor(private firestore: Firestore, private auth: Auth, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const eventId = params['id'];
      if (eventId) {
        this.loadEvent(eventId);
      }
    });
    this.loadUserProfile();
  }

  async loadEvent(eventId: string): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const eventDoc = await getDoc(doc(this.firestore, 'events', eventId));
      if (eventDoc.exists()) {
        this.event = { ...eventDoc.data(), id: eventId };
      } else {
        this.error = 'Event not found.';
      }
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to load event.';
    } finally {
      this.loading = false;
    }
  }

  async loadUserProfile(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) return;
      const docRef = doc(this.firestore, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d: any = snap.data();
        this.profilePicture = d.profilePicture || '';
        this.displayName = d.displayName || '';
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  }
}
