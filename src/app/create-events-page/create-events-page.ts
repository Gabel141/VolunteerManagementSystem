import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-events-page.html',
  styleUrls: ['./create-events-page.css'],
})
export class CreateEventsPage {
  eventTitle = '';
  eventDate = '';
  eventTime = '';
  eventLocation = '';
  eventDescription = '';

  events: any[] = [];

  constructor(private firestore: Firestore, private router: Router) {
    const eventsCollection = collection(this.firestore, 'events');
  collectionData (eventsCollection, { idField: 'id' })
    .subscribe(data => {
      this.events = data; // Assign to array so Angular detects changes
    });
  }

  createEvent() {
    const title = this.eventTitle;
    const date = this.eventDate;
    const time = this.eventTime;
    const location = this.eventLocation;
    const description = this.eventDescription;
    if (title && date && time && location && description) {
      const eventsCollection = collection(this.firestore, 'events');
      addDoc(eventsCollection, { title, date, time, location, description });
      this.eventTitle = '';
      this.eventDate = '';
      this.eventTime = '';
      this.eventLocation = '';
      this.eventDescription = '';
      this.router.navigate(['/events']);
    }

}
}
