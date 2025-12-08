import { Injectable, inject } from '@angular/core';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { UserService, UserInterface } from './user.service';

export interface SenderProfile {
  uid: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  updatedAt?: number;
}

@Injectable({ providedIn: 'root' })
export class SenderProfileCacheService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);

  // LRU cache: Map preserves insertion order; newest at end
  private cache = new Map<string, { value: SenderProfile; expiry: number }>();
  private listeners = new Map<string, () => void>();

  // configurable limits
  capacity = 300;
  ttlMs = 1000 * 60 * 10; // 10 minutes

  constructor() {}

  private touch(key: string, entry: { value: SenderProfile; expiry: number }) {
    // move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
  }

  private evictIfNeeded() {
    while (this.cache.size > this.capacity) {
      // evict least recently used (first key)
      const maybeFirst = this.cache.keys().next();
      const firstKey: string | undefined = maybeFirst ? maybeFirst.value : undefined;
      if (!firstKey) break;
      this.cache.delete(firstKey);
      const unsub = this.listeners.get(firstKey);
      if (unsub) {
        try { unsub(); } catch (e) {}
        this.listeners.delete(firstKey);
      }
    }
  }

  async get(uid: string): Promise<SenderProfile | null> {
    if (!uid) return null;
    const now = Date.now();
    const existing = this.cache.get(uid);
    if (existing && existing.expiry > now) {
      this.touch(uid, existing);
      return existing.value;
    }

    // fetch from firestore via UserService
    try {
      const user = await this.userService.getUserByUid(uid);
      if (!user) {
        // cache negative result for a short while
        const neg: SenderProfile = { uid, displayName: '', profilePicture: '' };
        this.cache.set(uid, { value: neg, expiry: now + 1000 * 60 });
        this.evictIfNeeded();
        return neg;
      }

      const profile: SenderProfile = { uid, displayName: user.displayName || user.email || '', profilePicture: user.profilePicture || '', updatedAt: now };
      this.cache.set(uid, { value: profile, expiry: now + this.ttlMs });
      this.evictIfNeeded();

      // set up a Firestore listener to auto-update cache if profile changes
      try {
        const unsub = onSnapshot(doc(this.firestore, 'users', uid) as any, (snap: any) => {
          if (snap && snap.exists && typeof snap.data === 'function') {
            const data = snap.data() as any;
            const updated: SenderProfile = { uid, displayName: data.displayName || data.email || '', profilePicture: data.profilePicture || '', bio: data.bio || '', updatedAt: Date.now() };
            this.cache.set(uid, { value: updated, expiry: Date.now() + this.ttlMs });
            this.touch(uid, this.cache.get(uid) as any);
          }
        });
        // store unsubscribe so we can cleanup on eviction
        this.listeners.set(uid, unsub as any);
      } catch (e) {
        // ignore listener errors
      }

      return profile;
    } catch (e) {
      console.error('SenderProfileCache get error', e);
      return null;
    }
  }

  async getMany(uids: string[]): Promise<Record<string, SenderProfile | null>> {
    const out: Record<string, SenderProfile | null> = {};
    const promises = uids.map(uid => this.get(uid));
    const results = await Promise.all(promises);
    uids.forEach((uid, idx) => out[uid] = results[idx]);
    return out;
  }

  invalidate(uid: string) {
    this.cache.delete(uid);
    const unsub = this.listeners.get(uid);
    if (unsub) {
      try { unsub(); } catch (e) {}
      this.listeners.delete(uid);
    }
  }

  clear() {
    this.cache.clear();
    this.listeners.forEach(u => { try { u(); } catch (e) {} });
    this.listeners.clear();
  }
}
