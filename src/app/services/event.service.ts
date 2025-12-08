import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventInterface {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  creator: string;
  creatorUid: string;
  creatorEmail?: string;
  creatorProfilePicture?: string;
  latitude?: number;
  longitude?: number;
  workType?: string;
  memberCap?: number;
  participants?: string[];
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  firestore = inject(Firestore);
  auth = inject(Auth);

  /**
   * Create a new event with creator UID binding
   */
  createEvent(event: Omit<EventInterface, 'id' | 'creatorUid' | 'creatorEmail'>): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const eventData: EventInterface = {
      ...event,
      creatorUid: user.uid,
      creatorEmail: user.email || '',
      participants: [user.uid], // Add creator as first participant
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const eventsCollection = collection(this.firestore, 'events');
    return addDoc(eventsCollection, eventData).then(docRef => docRef.id);
  }

  /**
   * Get events attending for a specific user uid
   */
  getEventsAttendingForUser(uid: string): Observable<EventInterface[]> {
    const eventsCollection = collection(this.firestore, 'events');
    return collectionData(eventsCollection, { idField: 'id' }).pipe(
      map((events: any[]) => events.filter(e => e.participants && e.participants.includes(uid)))
    ) as Observable<EventInterface[]>;
  }

  /**
   * Get all events
   */
  getEvents(): Observable<EventInterface[]> {
    const eventsCollection = collection(this.firestore, 'events');
    return collectionData(eventsCollection, { idField: 'id' }) as Observable<EventInterface[]>;
  }

  /**
   * Get events created by current user
   */
  getMyEvents(): Observable<EventInterface[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const eventsCollection = collection(this.firestore, 'events');
    const q = query(eventsCollection, where('creatorUid', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<EventInterface[]>;
  }

  /**
   * Get events created by a specific user (by uid)
   */
  getEventsByCreator(uid: string): Observable<EventInterface[]> {
    const eventsCollection = collection(this.firestore, 'events');
    const q = query(eventsCollection, where('creatorUid', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<EventInterface[]>;
  }

  /**
   * Get events user is attending
   */
  getEventsAttending(): Observable<EventInterface[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const eventsCollection = collection(this.firestore, 'events');
    return collectionData(eventsCollection, { idField: 'id' }).pipe(
      map((events: any[]) =>
        events.filter(event =>
          event.participants && event.participants.includes(user.uid) && event.creatorUid !== user.uid
        )
      )
    ) as Observable<EventInterface[]>;
  }

  /**
   * Get single event by ID
   */
  async getEvent(eventId: string): Promise<EventInterface | null> {
    try {
      const eventDoc = await getDoc(doc(this.firestore, 'events', eventId));
      if (eventDoc.exists()) {
        return { ...eventDoc.data() as EventInterface, id: eventId };
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  /**
   * Update event (only by creator)
   */
  async updateEvent(eventId: string, updates: Partial<EventInterface>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const event = await this.getEvent(eventId);
    if (!event || event.creatorUid !== user.uid) {
      throw new Error('Only the event creator can edit this event');
    }

    const eventRef = doc(this.firestore, 'events', eventId);
    return updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Delete event (only by creator)
   */
  async deleteEvent(eventId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const event = await this.getEvent(eventId);
    if (!event || event.creatorUid !== user.uid) {
      throw new Error('Only the event creator can delete this event');
    }

    const eventRef = doc(this.firestore, 'events', eventId);
    return deleteDoc(eventRef);
  }

  /**
   * Add user to event participants
   */
  async joinEvent(eventId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const participants = event.participants || [];
    
    // Check member cap if set
    if (event.memberCap && participants.length >= event.memberCap) {
      throw new Error(`Event is full (${event.memberCap} participants)`);
    }

    if (!participants.includes(user.uid)) {
      participants.push(user.uid);
      const eventRef = doc(this.firestore, 'events', eventId);
      return updateDoc(eventRef, { participants });
    }
  }

  /**
   * Remove user from event participants
   */
  async leaveEvent(eventId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const participants = (event.participants || []).filter(uid => uid !== user.uid);
    const eventRef = doc(this.firestore, 'events', eventId);
    return updateDoc(eventRef, { participants });
  }

  /**
   * Get participant details for an event
   */
  async getParticipants(eventId: string): Promise<any[]> {
    const event = await this.getEvent(eventId);
    if (!event || !event.participants) {
      return [];
    }

    const participants = [];
    for (const uid of event.participants) {
      try {
        const userDoc = await getDoc(doc(this.firestore, 'users', uid));
        if (userDoc.exists()) {
          participants.push({
            uid,
            ...userDoc.data()
          });
        }
      } catch (error) {
        console.error(`Error fetching participant ${uid}:`, error);
      }
    }
    return participants;
  }

  /**
   * Backfill events missing creatorProfilePicture by fetching user's profile picture.
   * Use with caution — this iterates all events and writes for those missing the field.
   */
  async backfillCreatorProfilePictures(): Promise<void> {
    try {
      const eventsCollection = collection(this.firestore, 'events');
      const snap = await getDocs(eventsCollection as any);
      for (const d of snap.docs) {
        const data: any = d.data();
        if (data && !data.creatorProfilePicture && data.creatorUid) {
          try {
            const userDoc = await getDoc(doc(this.firestore, 'users', data.creatorUid));
            if (userDoc.exists()) {
              const userData: any = userDoc.data();
              if (userData && userData.profilePicture) {
                await updateDoc(doc(this.firestore, 'events', d.id), { creatorProfilePicture: userData.profilePicture });
              }
            }
          } catch (e) {
            console.warn('Backfill: failed for event', d.id, e);
          }
        }
      }
    } catch (e) {
      console.error('Backfill failed', e);
      throw e;
    }
  }
}
