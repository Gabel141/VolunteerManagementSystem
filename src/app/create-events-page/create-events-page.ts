import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData, doc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { getDoc } from '@firebase/firestore';

@Component({
  selector: 'app-create-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-events-page.html',
  styleUrls: ['./create-events-page.css'],
})
export class CreateEventsPage {

  eventTitle = signal('');
  eventDate = signal('');
  eventTime = signal('');
  eventLocation = signal('');
  eventDescription = signal('');

  events: any[] = [];
  user: any;

  constructor(private firestore: Firestore, private auth: Auth, private router: Router) {
    const eventsCollection = collection(this.firestore, 'events');
  collectionData (eventsCollection, { idField: 'id' })
    .subscribe(data => {
      this.events = data; // Assign to array so Angular detects changes
    });
  }

  createEvent() {

    const user = this.auth.currentUser

    if (!user) {
      this.router.navigateByUrl('/login-page');
      return;
    }

    const title = this.eventTitle();
    const date = this.eventDate();
    const time = this.eventTime();
    const location = this.eventLocation();
    const description = this.eventDescription();
    const creator = user.displayName
    if (title && date && time && location && description && creator) {
      const eventsCollection = collection(this.firestore, 'events');
      addDoc(eventsCollection, { title, date, time, location, description, creator });
      this.eventTitle.set('');
      this.eventDate.set('');
      this.eventTime.set('');
      this.eventLocation.set('');
      this.eventDescription.set('');
      this.router.navigate(['/events']);
    }

}
}
