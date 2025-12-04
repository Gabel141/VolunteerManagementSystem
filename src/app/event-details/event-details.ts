import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
export class EventDetails {
  events$!: Observable<any[]>;
  profilePicture = '';
  displayName = '';

  constructor(private firestore: Firestore, private auth: Auth) {
    const eventsCol = collection(this.firestore, 'events');
    this.events$ = collectionData(eventsCol, { idField: 'id' }).pipe(
      map((items: any[]) => items.map(i => ({ ...i }))),
      map(items => items.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.loadUserProfile();
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
      // ignore for now
    }
  }
}
