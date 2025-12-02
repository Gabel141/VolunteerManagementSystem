import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionData, getDocs } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import { getDoc } from '@firebase/firestore';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails {

  eventTitle = signal('');
  eventDate = signal('');

  events: any[] = [];

  constructor(private firestore: Firestore, private router: Router, private route: ActivatedRoute) {
    const eventsCollection = collection(this.firestore, 'events');
  collectionData (eventsCollection, { idField: 'id' })
    .subscribe(data => {
      this.events = data; // Assign to array so Angular detects changes
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.events = this.events.find(e => e.id == id);
  }
  
  getInfo() {
    const eventsCollection = collection(this.firestore, 'events');
    const query = getDocs(eventsCollection);
    
  }

}
