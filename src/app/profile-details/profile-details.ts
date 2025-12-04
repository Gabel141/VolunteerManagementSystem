import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';

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

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      const user = this.auth.currentUser;
      if (!user) {
        this.error = 'No user logged in.';
        this.router.navigateByUrl('/login-page');
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

  uploadProgress = 0;

  async uploadProfilePicture(file: File | null): Promise<void> {
    if (!file) return;
    this.error = '';
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (!file.type || !file.type.startsWith('image/')) {
      this.error = 'Only image files are allowed.';
      return;
    }
    if (file.size > maxBytes) {
      this.error = 'File is too large. Maximum size is 5 MB.';
      return;
    }

    this.loading = true;
    this.uploadProgress = 0;

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('Not logged in');

      const storage = getStorage();
      const ref = storageRef(storage, `users/${user.uid}/profile.jpg`);
      const uploadTask = uploadBytesResumable(ref, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100;
          this.uploadProgress = Math.round(progress);
        },
        (err) => {
          this.loading = false;
          this.error = err?.message ?? 'Upload failed.';
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            this.profilePicture = url;
            await setDoc(doc(this.firestore, 'users', user.uid), { profilePicture: url }, { merge: true } as any);
            this.success = 'Profile picture uploaded.';
          } catch (e: any) {
            this.error = e?.message ?? 'Upload finalize failed.';
          } finally {
            this.loading = false;
            this.uploadProgress = 100;
          }
        }
      );
    } catch (err: any) {
      this.loading = false;
      this.error = err?.message ?? 'Upload failed.';
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth as any);
      await this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.message ?? 'Logout failed.';
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
