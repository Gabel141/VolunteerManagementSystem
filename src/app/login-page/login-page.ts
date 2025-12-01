import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from
'@angular/fire/firestore';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {

  title = signal('Volunteer Management System');

volunteerName = signal('');
volunteerEmail = signal('');
volunteerPassword = signal('');

volunteers: any[] = [];

constructor(private firestore: Firestore) {
const volunteersCollection = collection(this.firestore, 'volunteers');
collectionData(volunteersCollection, { idField: 'id' })
.subscribe(data => {
this.volunteers = data; // Assign to array so Angular detects changes
});
}

registerVolunteer() {
  const name = this.volunteerName();
  const email = this.volunteerEmail();
  const password = this.volunteerPassword();
  if (name && email && password) {
    const volunteersCollection = collection(this.firestore, 'volunteers');
    addDoc(volunteersCollection, {name, email, password});
    this.volunteerName();
    this.volunteerEmail();
    this.volunteerPassword();
  }
}

}
