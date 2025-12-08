import { Component, Input, inject, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Firestore, collection, collectionData, addDoc, query, orderBy, limit, doc, updateDoc, deleteDoc, setDoc, getDocs, where, startAfter } from '@angular/fire/firestore';
import { onSnapshot, serverTimestamp, endBefore, limitToLast, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { getDatabase, ref as rtdbRef, onDisconnect, onValue, set as rtdbSet, off as rtdbOff, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UserService } from '../services/user.service';
import { SenderProfileCacheService } from '../services/sender-profile-cache.service';

const EMOJI_PRESETS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🚀', '✨'];

@Component({
  selector: 'app-event-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-chat.html',
  styleUrls: ['./event-chat.css']
})
export class EventChatComponent implements OnDestroy {
  firestore = inject(Firestore);
  auth = inject(Auth);
  userService = inject(UserService);
  profileCache = inject(SenderProfileCacheService);

  // Expose Object for template use
  Object = Object;

  private _eventId: string | undefined;
  @Input()
  set eventId(value: string | undefined) {
    this._eventId = value;
    this.initMessages();
  }
  get eventId() { return this._eventId; }

  @Input() creatorUid?: string;

  // Angular 20 signals for reactive state
  messages = signal<any[]>([]);
  pendingMessages = signal<any[]>([]);
  newMessage = signal('');
  loading = signal(false);
  errorMessage = signal('');
  uploading = signal(false);
  uploadProgress = signal(0);
  showEmojiPicker = signal(false);
  onlineUsers = signal<any[]>([]);
  showOnlineList = signal(false);

  pageSize = 25;
  pageIncrement = 25;
  oldestVisibleTimestamp: any = null;
  messageSubscriptions: Map<string, () => void> = new Map();

  presenceSub: Subscription | null = null;
  messagesSub: Subscription | null = null;
  private rtdbListener: (() => void) | null = null;
  emojiPresets = EMOJI_PRESETS;

  private messagesColPath(): string {
    return `events/${this.eventId}/messages`;
  }

  // scroll lock and popover state
  private autoScrollEnabled = true;
  popoverVisible = false;
  popoverData: any = null;
  popoverStyle: any = { top: '0px', left: '0px' };

  // ensure sender profiles are loaded and messages enriched with senderPhoto/displayName
  private async ensureSenderProfiles(msgs: any[]) {
    if (!msgs || !msgs.length) return;
    const uids = Array.from(new Set(msgs.map(m => m.senderUid).filter(Boolean)));
    if (!uids.length) return;

    try {
      const profiles = await this.profileCache.getMany(uids);

      // update messages with any fetched profiles
      this.messages.update(curr => curr.map(m => {
        const prof = profiles[m.senderUid];
        if (prof) {
          m.senderPhoto = m.senderPhoto || prof.profilePicture || '';
          m.senderName = m.senderName || prof.displayName || m.senderName;
        }
        return m;
      }));

      // update pending messages
      this.pendingMessages.update(pm => pm.map(p => {
        const prof = profiles[p.senderUid];
        if (prof) {
          p.senderPhoto = p.senderPhoto || prof.profilePicture || '';
          p.senderName = p.senderName || prof.displayName || p.senderName;
        }
        return p;
      }));

      if (this.autoScrollEnabled) setTimeout(() => this.scrollToBottom(), 30);
    } catch (e) {
      // ignore
    }
  }

  initMessages() {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
      this.messagesSub = null;
    }
    if (!this.eventId) return;

    const colRef = collection(this.firestore, this.messagesColPath());
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(this.pageSize));

    const unsubscribe = onSnapshot(q as any, (snapshot: any) => {
      if (snapshot.docs.length) {
        const oldestDoc = snapshot.docs[snapshot.docs.length - 1];
        this.oldestVisibleTimestamp = oldestDoc.data()?.createdAt || null;
      }

      const docs = snapshot.docs.map((d: any) => {
        const data: any = { id: d.id, ...d.data() };
        if (data?.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate();
        if (data?.editedAt && typeof data.editedAt.toDate === 'function') data.editedAt = data.editedAt.toDate();
        // leave enrichment to ensureSenderProfiles (uses cache/service)
        return data;
      });

      this.messages.set(docs.reverse());

      // ensure sender photos for visible messages
      this.ensureSenderProfiles(this.messages());

      const confirmedClientIds = new Set(this.messages().map(m => m.clientId).filter(Boolean));
      this.pendingMessages.update(pm => pm.filter(p => !confirmedClientIds.has(p.clientId)));

      setTimeout(() => this.scrollToBottom(), 50);
    }, (err: any) => {
      console.error('Chat snapshot error', err);
    });

    this.messagesSub = { unsubscribe } as any;
    // attach scroll listener for sticky-scroll behavior
    this.attachScrollListener();
    this.initPresenceRTDB();
  }

  private attachScrollListener() {
    try {
      const endEl = document.getElementById(`chat-end-${this.eventId}`);
      const container = endEl?.parentElement as HTMLElement | null;
      if (!container) return;
      container.addEventListener('scroll', this._boundOnScroll = this.onChatScroll.bind(this));
    } catch (e) {}
  }

  private detachScrollListener() {
    try {
      const endEl = document.getElementById(`chat-end-${this.eventId}`);
      const container = endEl?.parentElement as HTMLElement | null;
      if (!container) return;
      if (this._boundOnScroll) container.removeEventListener('scroll', this._boundOnScroll as any);
    } catch (e) {}
  }

  private _boundOnScroll: any = null;

  onChatScroll(ev: any) {
    try {
      const target = ev.target as HTMLElement;
      const atBottom = (target.scrollHeight - target.scrollTop - target.clientHeight) < 60;
      this.autoScrollEnabled = atBottom;
    } catch (e) {}
  }

  showAvatarPopover(uid: string, ev: MouseEvent | TouchEvent) {
    if (!uid) return;
    const touch = (ev as TouchEvent).touches && (ev as TouchEvent).touches[0];
    const x = touch ? touch.clientX : (ev as MouseEvent).clientX;
    const y = touch ? touch.clientY : (ev as MouseEvent).clientY;
    this.popoverStyle = { left: (x + 8) + 'px', top: (y + 8) + 'px' };
    this.popoverVisible = true;
    this.profileCache.get(uid).then(p => {
      this.popoverData = p || { uid };
    }).catch(() => { this.popoverData = { uid }; });
  }

  hideAvatarPopover() {
    setTimeout(() => { this.popoverVisible = false; this.popoverData = null; }, 120);
  }

  async sendMessage() {
    this.errorMessage.set('');
    if (!this.newMessage() || !this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) {
      this.errorMessage.set('You must be signed in to send messages.');
      return;
    }

    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const text = this.newMessage().trim();
    if (!text) return;

    // Optimistic UI: push pending message
    const pending = {
      id: clientId,
      clientId,
      text,
      senderUid: user.uid,
      senderName: user.displayName || user.email || 'Unknown',
      senderPhoto: '',
      createdAt: new Date(),
      status: 'pending'
    };
    this.pendingMessages.update(pm => [...pm, pending]);
    this.newMessage.set('');

    try {
      this.loading.set(true);
      const payload: any = {
        text,
        senderUid: user.uid,
        senderName: user.displayName || user.email || 'Unknown',
        senderPhoto: '',
        clientId,
        createdAt: serverTimestamp(),
      };

      // attach sender photo if available
      try {
        if (this.userService) {
          const prof = await this.userService.getCurrentUserProfile();
          if (prof && prof.profilePicture) payload.senderPhoto = prof.profilePicture;
        }
      } catch (e) {}

      await addDoc(collection(this.firestore, this.messagesColPath()), payload);
      // success: the real-time listener will reconcile the pending message
    } catch (err: any) {
      console.error('Failed to send message', err);
      // mark pending as failed
      const p = this.pendingMessages().find((pm: any) => pm.clientId === clientId);
      if (p) p.status = 'failed';
      this.errorMessage.set('Failed to send message. You can retry or remove it.');
    } finally {
      this.loading.set(false);
    }
  }

  retryPending(clientId: string) {
    const pIndex = this.pendingMessages().findIndex((pm: any) => pm.clientId === clientId && pm.status === 'failed');
    if (pIndex === -1) return;
    const p = this.pendingMessages()[pIndex];
    this.newMessage.set(p.text);
    this.pendingMessages.update(pm => pm.filter((_, i) => i !== pIndex));
    // user can press send again
  }

  removePending(clientId: string) {
    this.pendingMessages.update(pm => pm.filter((p: any) => p.clientId !== clientId));
  }

  async editMessage(messageId: string, newText: string) {
    if (!this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;

    const targetDoc = doc(this.firestore, `${this.messagesColPath()}/${messageId}`);
    try {
      await updateDoc(targetDoc, { text: newText, edited: true, editedAt: serverTimestamp() } as any);
    } catch (err) {
      console.error('Edit failed', err);
      this.errorMessage.set('Edit failed.');
    }
  }

  async deleteMessage(messageId: string) {
    if (!this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;

    const targetDoc = doc(this.firestore, `${this.messagesColPath()}/${messageId}`);
    try {
      await deleteDoc(targetDoc);
    } catch (err) {
      console.error('Delete failed', err);
      this.errorMessage.set('Delete failed.');
    }
  }

  // Reactions: toggle user's reaction (adds/removes user's uid in array)
  async toggleReaction(messageId: string, emoji: string) {
    if (!this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;
    this.showEmojiPicker.set(false);
    const msgRef = doc(this.firestore, `${this.messagesColPath()}/${messageId}`);
    try {
      const snap = await getDoc(msgRef as any);
      const data: any = snap.exists() ? snap.data() : {};
      const reactions = data?.reactions || {};
      const usersForEmoji: string[] = reactions[emoji] || [];
      const hasReacted = usersForEmoji.includes(user.uid);
      if (hasReacted) {
        await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayRemove(user.uid) } as any);
      } else {
        await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayUnion(user.uid) } as any);
      }
    } catch (e) {
      console.error('Reaction toggle failed', e);
    }
  }

  toggleEmojiPicker() {
    this.showEmojiPicker.update(v => !v);
  }

  // Attachment upload (images)
  async uploadAttachment(file: File | null) {
    if (!file || !this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;
    this.uploading.set(true);
    this.uploadProgress.set(0);
    try {
      const storage = getStorage();
      const clientId = `att_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const ref = storageRef(storage, `events/${this.eventId}/attachments/${clientId}_${file.name}`);
      const task = uploadBytesResumable(ref, file);
      task.on('state_changed', snapshot => {
        const progress = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100;
        this.uploadProgress.set(Math.round(progress));
      }, (err: any) => {
        console.error('Upload failed', err);
      }, async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        // send message with attachment
        const clientIdMsg = `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const payload: any = {
          text: '',
          senderUid: user.uid,
          senderName: user.displayName || user.email || 'Unknown',
          senderPhoto: '',
          clientId: clientIdMsg,
          createdAt: serverTimestamp(),
          attachmentUrl: url,
          attachmentName: file.name,
        };
        await addDoc(collection(this.firestore, this.messagesColPath()), payload);
        this.uploadProgress.set(100);
      });
    } catch (e) {
      console.error('Attachment upload error', e);
    } finally {
      this.uploading.set(false);
    }
  }

  // Moderation: ban/mute via event moderation subcollection
  async banUser(userUid: string) {
    if (!this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;
    const modRef = doc(this.firestore, `events/${this.eventId}/moderation/banned_${userUid}`);
    try {
      await setDoc(modRef, { uid: userUid, bannedBy: user.uid, at: serverTimestamp() });
    } catch (e) {
      console.error('Ban failed', e);
    }
  }

  async muteUser(userUid: string) {
    if (!this.eventId) return;
    const user = this.auth.currentUser;
    if (!user) return;
    const modRef = doc(this.firestore, `events/${this.eventId}/moderation/muted_${userUid}`);
    try {
      await setDoc(modRef, { uid: userUid, mutedBy: user.uid, at: serverTimestamp() });
    } catch (e) {
      console.error('Mute failed', e);
    }
  }

  // Small DOM helper; uses element id
  scrollToBottom() {
    try {
      const el = document.getElementById(`chat-end-${this.eventId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch (e) {
      // ignore
    }
  }

  isCreatorMessage(msg: any) {
    return msg?.senderUid && this.creatorUid && msg.senderUid === this.creatorUid;
  }

  canModifyMessage(msg: any) {
    const user = this.auth.currentUser;
    if (!user) return false;
    // author or event creator can modify
    return (msg.senderUid === user.uid) || (this.creatorUid === user.uid);
  }

  // Simple pagination: increase page size and re-init subscription
  loadMore() {
    this.pageSize += this.pageIncrement;
    // re-init subscription will pick up larger page
    this.initMessages();
  }

  // Cursor-based pagination: load older messages before the oldestVisibleTimestamp
  async loadOlderMessages() {
    if (!this.eventId || !this.oldestVisibleTimestamp) return;
    try {
      const colRef = collection(this.firestore, this.messagesColPath());
      const olderQ = query(colRef, orderBy('createdAt'), endBefore(this.oldestVisibleTimestamp), limitToLast(this.pageIncrement));
      const snap = await getDocs(olderQ as any);
      const older = snap.docs.map((d: any) => {
        const data: any = { id: d.id, ...d.data() };
        if (data?.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate();
        return data;
      });

      if (older.length) {
        // older are in ascending order due to orderBy asc + limitToLast
        this.messages.update(m => [...older, ...m]);
        // update oldestVisibleTimestamp to the earliest fetched
        const oldestData = snap.docs[0]?.data() as any;
        const oldestTime = oldestData?.createdAt;
        this.oldestVisibleTimestamp = oldestTime || this.oldestVisibleTimestamp;

        // Subscribe to real-time updates for this range
        if (older.length > 0) {
          this.subscribeToOlderMessageRange(older[0].createdAt, this.oldestVisibleTimestamp);
        }
      }
    } catch (e) {
      console.error('Failed to load older messages', e);
    }
  }

  private subscribeToOlderMessageRange(fromTimestamp: any, toTimestamp: any) {
    if (!this.eventId) return;
    const rangeKey = `${fromTimestamp?.toString()}_${toTimestamp?.toString()}`;
    if (this.messageSubscriptions.has(rangeKey)) return; // already subscribed

    const colRef = collection(this.firestore, this.messagesColPath());
    const rangeQ = query(colRef, orderBy('createdAt'), startAfter(fromTimestamp), endBefore(toTimestamp));

    const unsubscribe = onSnapshot(rangeQ as any, (snap: any) => {
      const updated = snap.docs.map((d: any) => {
        const data: any = { id: d.id, ...d.data() };
        if (data?.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate();
        return data;
      });

      // Merge into messages, updating existing ones and adding new ones
      this.messages.update(msgs => {
        const msgMap = new Map(msgs.map((m: any) => [m.id, m]));
        updated.forEach((m: any) => msgMap.set(m.id, m));
        return Array.from(msgMap.values()).sort((a: any, b: any) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
      });
    });

    this.messageSubscriptions.set(rangeKey, unsubscribe);
  }

  // Presence using Realtime Database for robust online/offline
  initPresenceRTDB() {
    try {
      const user = this.auth.currentUser;
      if (!user || !this.eventId) return;
      const db = getDatabase();

      const presenceRef = rtdbRef(db, `presence/${this.eventId}/${user.uid}`);
      const connectedRef = rtdbRef(db, '.info/connected');

      // When connected, write presence and ensure it's removed on disconnect
      const connectedListener = (snap: any) => {
        if (snap.val() === true) {
          // write a small object (can be extended with lastSeen)
          rtdbSet(presenceRef, { displayName: user.displayName || user.email || '' }).catch(() => {});
          onDisconnect(presenceRef).remove().catch(() => {});
        }
      };
      onValue(connectedRef, connectedListener);

      // listen to presence list for this event; if a child exists it's considered online
      const listRef = rtdbRef(db, `presence/${this.eventId}`);
      const listener = (snapshot: any) => {
        const val = snapshot.val() || {};
        const users = Object.keys(val).map(k => ({ uid: k, ...val[k] }));
        this.onlineUsers.set(users);
      };
      onValue(listRef, listener);

      // store cleanup to remove listeners and remove our presence node
      this.rtdbListener = () => {
        try { rtdbOff(connectedRef, 'value', connectedListener); } catch (e) {}
        try { rtdbOff(listRef, 'value', listener); } catch (e) {}
        try { rtdbSet(presenceRef, null); } catch (e) {}
      };

      // Best-effort cleanup on unload
      window.addEventListener('beforeunload', () => {
        try { rtdbSet(presenceRef, null); } catch (e) {}
      });
    } catch (e) {
      console.warn('RTDB presence init failed', e);
    }
  }

  isUserOnline(uid?: string): boolean {
    if (!uid) return false;
    return this.onlineUsers().some(u => u.uid === uid);
  }

  toggleOnlineList() {
    this.showOnlineList.update(v => !v);
  }

  ngOnDestroy() {
    if (this.messagesSub) this.messagesSub.unsubscribe();
    if (this.presenceSub) this.presenceSub.unsubscribe();
    if (this.rtdbListener) this.rtdbListener();
    try { this.detachScrollListener(); } catch (e) {}
  }
}
