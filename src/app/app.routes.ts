import { Routes } from '@angular/router';
import { Home } from './home/home';
import { EventsPage } from './events-page/events-page';
import { EventDetails } from './event-details/event-details';
import { CreateEventsPage } from './create-events-page/create-events-page';
import { ProfileDetails } from './profile-details/profile-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'events', component: EventsPage },
  { path: 'event-details/:id', component: EventDetails },
  { path: 'create-event', component: CreateEventsPage },
  { path: 'profile', component: ProfileDetails },
];
