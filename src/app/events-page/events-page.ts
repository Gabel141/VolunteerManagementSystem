import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './events-page.html',
  styleUrls: ['./events-page.css'],
})
export class EventsPage {
  // search term as a BehaviorSubject so template can update it
  private search$ = new BehaviorSubject<string>('');

  // raw events observable from Firestore
  events$: Observable<any[]>;

  // derived filtered observable used by the template
  filtered$!: Observable<any[]>;

  constructor(private firestore: Firestore) {
    const eventsCol = collection(this.firestore, 'events');
    this.events$ = collectionData(eventsCol, { idField: 'id' }).pipe(
      // ensure stable stream and share
      map((items: any[]) => {
        // normalize possible createdAt and sort newest first
        return items
          .map(i => ({
            ...i,
            createdAt: i.createdAt ? new Date(i.createdAt) : null
          }))
          .sort((a, b) => {
            const ta = a.createdAt ? a.createdAt.getTime() : 0;
            const tb = b.createdAt ? b.createdAt.getTime() : 0;
            return tb - ta;
          });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.filtered$ = combineLatest([this.events$, this.search$.pipe(startWith(''))]).pipe(
      map(([events, search]) => {
        const q = (search || '').trim().toLowerCase();
        if (!q) return events;
        return events.filter(e => {
          return (
            (e.title && e.title.toLowerCase().includes(q)) ||
            (e.location && e.location.toLowerCase().includes(q)) ||
            (e.description && e.description.toLowerCase().includes(q))
          );
        });
      })
    );
  }

  updateSearch(value: string) {
    this.search$.next(value || '');
  }
}