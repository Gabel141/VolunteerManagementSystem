import { Routes } from '@angular/router';
import { LoginPage } from './login-page/login-page';
import { Home } from './home/home';
import { EventsPage } from './events-page/events-page';
import { CreateEventsPage } from './create-events-page/create-events-page';

export const routes: Routes = [
  { path: '', component: LoginPage },
  { path: 'events', component: EventsPage },
  { path: 'create-event', component: CreateEventsPage }
];
