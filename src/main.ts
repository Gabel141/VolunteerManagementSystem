import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';

bootstrapApplication(App, {
providers: [
provideFirebaseApp(() => initializeApp(environment.firebase)),

provideFirestore(() => getFirestore())
]
}).catch(err => console.error(err));
