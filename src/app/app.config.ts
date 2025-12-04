import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAuth } from '@angular/fire/auth';
import { getAuth } from 'firebase/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({ projectId: "volunteer-events-management", appId: "1:655730869330:web:eb2e4c15b0dcf1a8c64b8b", storageBucket: "volunteer-events-management.firebasestorage.app", apiKey: "AIzaSyDAgEoKYxzPAlf3iXS1ZtCfL1M80BSrjAs", authDomain: "volunteer-events-management.firebaseapp.com", messagingSenderId: "655730869330"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
