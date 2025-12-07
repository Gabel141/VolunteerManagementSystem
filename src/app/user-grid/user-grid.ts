import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collection } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface SimpleUser {
  uid: string;
  displayName: string;
  email?: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-user-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-grid.html',
  styleUrls: ['./user-grid.css']
})
export class UserGridComponent {
  firestore = inject(Firestore);
  users$: Observable<SimpleUser[]>;

  constructor() {
    const usersCol = collection(this.firestore, 'users');
    this.users$ = collectionData(usersCol, { idField: 'uid' }) as Observable<SimpleUser[]>;
  }

  getInitials(name?: string) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  }
}
