import { Routes } from '@angular/router';
import { Home } from './home/home';
import { EventsPage } from './events-page/events-page';
import { EventDetails } from './event-details/event-details';
import { CreateEventsPage } from './create-events-page/create-events-page';
import { ProfileDetails } from './profile-details/profile-details';
import { MyEventsPage } from './my-events-page/my-events-page';
import { AttendingEventsPage } from './attending-events-page/attending-events-page';
import { verifiedUserGuard } from './services/verified-user.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'events', component: EventsPage },
  { path: 'event-details/:id', component: EventDetails },
  { path: 'create-event', component: CreateEventsPage, canActivate: [verifiedUserGuard] },
  { path: 'my-events', component: MyEventsPage, canActivate: [verifiedUserGuard] },
  { path: 'attending', component: AttendingEventsPage, canActivate: [verifiedUserGuard] },
  { path: 'profile', component: ProfileDetails },
  { path: 'profile/:uid', component: ProfileDetails },
];
