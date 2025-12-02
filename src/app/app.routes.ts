import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginPage } from './login-page/login-page';
import { EventsPage } from './events-page/events-page';
import { EventDetails } from './event-details/event-details';
import { CreateEventsPage } from './create-events-page/create-events-page';

export const routes: Routes = [

    {path: '', component: Home},
    {path: 'login-page', component: LoginPage},
    {path: 'events', component: EventsPage},
    {path: 'event-details/:id', component: EventDetails},
    {path: 'create-event', component: CreateEventsPage}
];
