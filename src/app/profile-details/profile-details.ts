import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-details.html',
  styleUrls: ['./profile-details.css'],
})
export class ProfileDetails implements OnInit {
  // Profile fields
  displayName = '';
  email = '';
  phone = '';
  bio = '';
  location = '';
  profilePicture = '';

  // UI state
  loading = false;
  error = '';
  success = '';
  isEditing = false;

  constructor(private auth: Auth, private firestore: Firestore) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) {
        this.error = 'No user logged in.';
        return;
      }

      const profileDoc = await getDoc(
        doc(this.firestore, 'users', user.uid)
      );

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        this.displayName = data['displayName'] || '';
        this.email = data['email'] || user.email || '';
        this.phone = data['phone'] || '';
        this.bio = data['bio'] || '';
        this.location = data['location'] || '';
        this.profilePicture = data['profilePicture'] || '';
      } else {
        this.email = user.email || '';
      }
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to load profile.';
    } finally {
      this.loading = false;
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.error = '';
    this.success = '';
  }

  async saveProfile(): Promise<void> {
    this.error = '';
    this.success = '';
    if (!this.displayName) {
      this.error = 'Display name is required.';
      return;
    }

    this.loading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) {
        this.error = 'No user logged in.';
        return;
      }

      await setDoc(doc(this.firestore, 'users', user.uid), {
        displayName: this.displayName,
        email: this.email,
        phone: this.phone,
        bio: this.bio,
        location: this.location,
        profilePicture: this.profilePicture,
        updatedAt: new Date().toISOString(),
      });

      this.success = 'Profile saved successfully.';
      this.isEditing = false;
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to save profile.';
    } finally {
      this.loading = false;
    }
  }

  getInitials(): string {
    const parts = (this.displayName || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (this.displayName || '').charAt(0).toUpperCase();
  }
}
