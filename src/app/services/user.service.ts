import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface UserInterface {
  uid: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  emailVerified?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  firestore = inject(Firestore);
  auth = inject(Auth);

  /**
   * Get current user profile from Firestore
   */
  async getCurrentUserProfile(): Promise<UserInterface | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserInterface;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string): Promise<UserInterface | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserInterface;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserInterface>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(this.firestore, 'users', user.uid);
    return updateDoc(userRef, updates);
  }

  /**
   * Create or update user document after registration
   */
  async createUserProfile(email: string, displayName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(this.firestore, 'users', user.uid);
    return updateDoc(userRef, {
      uid: user.uid,
      email,
      displayName,
      emailVerified: false,
      createdAt: new Date()
    }).catch(error => {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        return getDoc(userRef).then(() => {
          // Update if exists
          return updateDoc(userRef, {
            uid: user.uid,
            email,
            displayName,
            emailVerified: false,
            createdAt: new Date()
          });
        }).catch(() => {
          // Create if doesn't exist
          return updateDoc(userRef, {
            uid: user.uid,
            email,
            displayName,
            emailVerified: false,
            createdAt: new Date()
          });
        });
      }
      throw error;
    });
  }
}
