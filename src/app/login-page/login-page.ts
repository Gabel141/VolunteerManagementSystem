import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from
'@angular/fire/firestore';

@Component({
selector: 'app-root',
standalone: true,
imports: [CommonModule, FormsModule],
templateUrl: './login-page.html',
styleUrls: ['./login-page.css']
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
if (this.volunteerName() && this.volunteerEmail() && this.volunteerPassword()) {
const volunteersCollection = collection(this.firestore, 'volunteers');
}
}

}
