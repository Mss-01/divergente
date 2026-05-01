import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NewEntryModalService } from '../../../core/services/new-entry-modal.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Only visible on mobile (md:hidden) -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden
                bg-slate-950/95 backdrop-blur-md border-t border-slate-800
                flex items-center justify-around px-2 pb-safe"
         style="padding-bottom: max(12px, env(safe-area-inset-bottom))">

      <a routerLink="/dashboard"
         routerLinkActive="text-indigo-400"
         [routerLinkActiveOptions]="{ exact: true }"
         class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl
                text-slate-500 transition-colors min-w-[60px]">
        <span class="material-symbols-outlined text-2xl">dashboard</span>
        <span class="text-[10px] font-medium tracking-wide">Dashboard</span>
      </a>

      <a routerLink="/vault"
         routerLinkActive="text-indigo-400"
         class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl
                text-slate-500 transition-colors min-w-[60px]">
        <span class="material-symbols-outlined text-2xl">lock</span>
        <span class="text-[10px] font-medium tracking-wide">Vault</span>
      </a>

      <!-- Center Add button -->
      <button (click)="modal.open()"
              class="flex flex-col items-center gap-1 py-2 px-4 -mt-4 rounded-xl
                     text-on-primary-container transition-colors min-w-[60px]">
        <div class="w-12 h-12 bg-primary-container rounded-full flex items-center
                    justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform">
          <span class="material-symbols-outlined text-xl">add</span>
        </div>
        <span class="text-[10px] font-medium tracking-wide text-slate-500">New</span>
      </button>

      <a routerLink="/security-audit"
         routerLinkActive="text-indigo-400"
         class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl
                text-slate-500 transition-colors min-w-[60px]">
        <span class="material-symbols-outlined text-2xl">security</span>
        <span class="text-[10px] font-medium tracking-wide">Audit</span>
      </a>

      <a href="#"
         class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl
                text-slate-500 transition-colors min-w-[60px]">
        <span class="material-symbols-outlined text-2xl">settings</span>
        <span class="text-[10px] font-medium tracking-wide">Settings</span>
      </a>

    </nav>
  `,
})
export class BottomNavComponent {
  modal = inject(NewEntryModalService);
}
