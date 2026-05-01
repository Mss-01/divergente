import { Injectable, signal } from '@angular/core';

/** Controls the global New Entry modal visibility from anywhere in the app. */
@Injectable({ providedIn: 'root' })
export class NewEntryModalService {
  isOpen = signal(false);

  open():  void { this.isOpen.set(true);  }
  close(): void { this.isOpen.set(false); }
}
