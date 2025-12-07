import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  id: string;
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modals = new Map<string, boolean>();

  openModal(id: string): void {
    this.modals.set(id, true);
  }

  closeModal(id: string): void {
    this.modals.set(id, false);
  }

  toggleModal(id: string): void {
    const current = this.modals.get(id) ?? false;
    this.modals.set(id, !current);
  }

  isOpen(id: string): boolean {
    return this.modals.get(id) ?? false;
  }

  closeAllModals(): void {
    this.modals.forEach((_, key) => {
      this.modals.set(key, false);
    });
  }
}
