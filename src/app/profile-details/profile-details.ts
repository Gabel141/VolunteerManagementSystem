import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { ModalService } from '../services/modal.service';
import { EventService, EventInterface } from '../services/event.service';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile-details.html',
  styleUrls: ['./profile-details.css'],
})
export class ProfileDetails implements OnInit {
  // Inject dependencies
  auth = inject(Auth);
  firestore = inject(Firestore);
  router = inject(Router);
  route = inject(ActivatedRoute);
  modalService = inject(ModalService);
  eventService = inject(EventService);

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
  // UID of the profile being viewed (null = current user)
  viewedUid: string | null = null;
  // Whether the profile shown belongs to the logged-in user
  isOwner = false;

  // Events created by this user
  eventsCreated: EventInterface[] = [];

  ngOnInit() {
    // Read route param 'uid' if present
    const paramUid = this.route.snapshot.paramMap.get('uid');
    if (paramUid) {
      this.viewedUid = paramUid;
    }
    this.loadProfile();
  }
  async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      // Determine which UID to load: viewedUid (from route) or current user
      const currentUser = this.auth.currentUser;
      const uidToLoad = this.viewedUid ?? currentUser?.uid ?? null;

      if (!uidToLoad) {
        this.error = 'No user specified and no user logged in.';
        if (!currentUser) this.modalService.openModal('login');
        return;
      }

      this.isOwner = !!(currentUser && currentUser.uid === uidToLoad);

      const profileDoc = await getDoc(doc(this.firestore, 'users', uidToLoad));

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        this.displayName = data['displayName'] || '';
        this.email = data['email'] || '';
        this.phone = data['phone'] || '';
        this.bio = data['bio'] || '';
        this.location = data['location'] || '';
        this.profilePicture = data['profilePicture'] || '';
      } else {
        // If viewing own profile but doc doesn't exist, fall back to auth info
        if (this.isOwner && currentUser) {
          this.email = currentUser.email || '';
        } else {
          this.error = 'Profile not found.';
        }
      }
      // Load created events for this profile
      try {
        if (uidToLoad) {
          // If viewing own profile use getMyEvents (keeps realtime for owner), otherwise query by creator uid
          const events$ = this.isOwner ? this.eventService.getMyEvents() : this.eventService.getEventsByCreator(uidToLoad);
          events$.subscribe(list => {
            // Sort by createdAt descending if available
            this.eventsCreated = (list || []).slice().sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            });
          });
        }
      } catch (e) {
        // non-fatal
        console.warn('Failed to load created events', e);
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
  uploadingPicture = false;

  async uploadProfilePicture(file: File | null): Promise<void> {
    if (!file) return;
    this.error = '';
    this.success = '';

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (!file.type || !file.type.startsWith('image/')) {
      this.error = 'Only image files are allowed (JPG, PNG, WebP, etc.).';
      return;
    }
    if (file.size > maxBytes) {
      this.error = 'File is too large. Maximum size is 5 MB.';
      return;
    }

    this.uploadingPicture = true;
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
          this.uploadingPicture = false;
          this.uploadProgress = 0;
          this.error = err?.message ?? 'Upload failed.';
          console.error('Upload error:', err);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            // Update local state immediately for instant UI feedback
            this.profilePicture = url;

            // Update Firestore with the new URL
            await updateDoc(doc(this.firestore, 'users', user.uid), {
              profilePicture: url,
              updatedAt: new Date().toISOString()
            });

            this.success = 'Profile picture uploaded successfully!';
            this.uploadProgress = 100;

            // Reset after brief delay
            setTimeout(() => {
              this.uploadingPicture = false;
              this.uploadProgress = 0;
            }, 800);
          } catch (e: any) {
            this.uploadingPicture = false;
            this.uploadProgress = 0;
            this.error = e?.message ?? 'Failed to save profile picture. Please try again.';
            console.error('Finalize error:', e);
          }
        }
      );
    } catch (err: any) {
      this.uploadingPicture = false;
      this.uploadProgress = 0;
      this.error = err?.message ?? 'Upload failed. Please try again.';
      console.error('Upload init error:', err);
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
