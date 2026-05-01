import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  /** true = sidebar visible, false = collapsed */
  isOpen = signal(window.innerWidth >= 768);

  toggle(): void { this.isOpen.update(v => !v); }
  open():   void { this.isOpen.set(true);  }
  close():  void { this.isOpen.set(false); }
}
