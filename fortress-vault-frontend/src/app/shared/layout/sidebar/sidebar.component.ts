import { Component, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NewEntryModalService } from '../../../core/services/new-entry-modal.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <!-- Backdrop (mobile only) — closes sidebar when tapping outside -->
    @if (sidebar.isOpen() && isMobile()) {
      <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
           (click)="sidebar.close()"></div>
    }

    <nav class="fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 z-50
                flex flex-col py-6 transition-all duration-300 ease-in-out overflow-hidden"
         [style.width]="sidebar.isOpen() ? '256px' : '0px'">

      <!-- Brand -->
      <div class="px-md mb-lg flex items-center justify-center flex-shrink-0 min-w-[224px]">
        <img src="logo.png" alt="Divergente" class="h-24 w-auto object-contain" />
      </div>

      <!-- New Entry CTA -->
      <div class="px-lg mb-lg flex-shrink-0 min-w-[224px]">
        <button (click)="newEntryModal.open(); closeMobile()"
                class="w-full bg-primary-container text-on-primary-container hover:bg-indigo-600
                       transition-colors duration-200 rounded-lg py-sm px-md flex items-center
                       justify-center gap-xs text-title-md shadow-sm active:scale-95 whitespace-nowrap">
          <span class="material-symbols-outlined text-sm">add</span>
          New Entry
        </button>
      </div>

      <!-- Navigation -->
      <ul class="flex-1 flex flex-col gap-xs px-md min-w-[224px]">
        <li>
          <a routerLink="/dashboard"
             routerLinkActive="text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500"
             [routerLinkActiveOptions]="{ exact: true }"
             (click)="closeMobile()"
             class="flex items-center gap-sm px-md py-sm rounded-lg text-slate-400
                    hover:text-slate-200 hover:bg-slate-900 transition-colors duration-200
                    active:scale-95 whitespace-nowrap">
            <span class="material-symbols-outlined flex-shrink-0">dashboard</span>
            Dashboard
          </a>
        </li>
        <li>
          <a routerLink="/vault"
             routerLinkActive="text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500"
             (click)="closeMobile()"
             class="flex items-center gap-sm px-md py-sm rounded-lg text-slate-400
                    hover:text-slate-200 hover:bg-slate-900 transition-colors duration-200
                    active:scale-95 whitespace-nowrap">
            <span class="material-symbols-outlined flex-shrink-0">lock</span>
            Vault Management
          </a>
        </li>
        <li>
          <a routerLink="/security-audit"
             routerLinkActive="text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500"
             (click)="closeMobile()"
             class="flex items-center gap-sm px-md py-sm rounded-lg text-slate-400
                    hover:text-slate-200 hover:bg-slate-900 transition-colors duration-200
                    active:scale-95 whitespace-nowrap">
            <span class="material-symbols-outlined flex-shrink-0">security</span>
            Security Audit
          </a>
        </li>
        <li>
          <a href="#"
             class="flex items-center gap-sm px-md py-sm rounded-lg text-slate-400
                    hover:text-slate-200 hover:bg-slate-900 transition-colors duration-200
                    active:scale-95 whitespace-nowrap">
            <span class="material-symbols-outlined flex-shrink-0">settings</span>
            Settings
          </a>
        </li>
      </ul>

      <!-- User profile -->
      @if (authService.currentUser$ | async; as user) {
        <div class="mt-auto px-lg pt-lg border-t border-slate-800 flex items-center gap-sm
                    flex-shrink-0 min-w-[224px]">
          <div class="w-10 h-10 rounded-full bg-indigo-900 border border-indigo-500/30
                      flex items-center justify-center text-indigo-300 text-title-md
                      font-semibold flex-shrink-0">
            {{ user.displayName?.charAt(0) ?? user.email?.charAt(0) ?? '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-title-md text-on-surface truncate">{{ user.displayName ?? 'User' }}</p>
            <p class="text-label-sm text-on-surface-variant truncate">{{ user.email }}</p>
          </div>
          <button (click)="signOut()" title="Sign out"
                  class="p-xs text-slate-400 hover:text-error transition-colors rounded-lg flex-shrink-0">
            <span class="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      }
    </nav>
  `,
})
export class SidebarComponent {
  authService   = inject(AuthService);
  newEntryModal = inject(NewEntryModalService);
  sidebar       = inject(SidebarService);

  isMobile(): boolean { return window.innerWidth < 768; }

  /** Close sidebar automatically when navigating on mobile */
  closeMobile(): void {
    if (this.isMobile()) this.sidebar.close();
  }

  signOut(): void {
    this.authService.signOut().subscribe();
  }

  /** Close sidebar on Escape key */
  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isMobile()) this.sidebar.close(); }
}
