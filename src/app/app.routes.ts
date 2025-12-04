import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginPage } from './login-page/login-page';
import { EventsPage } from './events-page/events-page';
import { EventDetails } from './event-details/event-details';
import { CreateEventsPage } from './create-events-page/create-events-page';
import { Register } from './register/register';
import { ProfileDetails } from './profile-details/profile-details';
 
export const routes: Routes = [
    {path: 'login-page', component: LoginPage},
    {path: '', component: EventsPage},
    {path: 'event-details/:id', component: EventDetails},
    {path: 'create-event', component: CreateEventsPage},
    {path: 'register', component: Register},
    {path: 'profile', component: ProfileDetails},

];
