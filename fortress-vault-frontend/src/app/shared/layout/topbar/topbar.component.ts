import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AlertCountService } from '../../../core/services/alert-count.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <header class="fixed top-0 right-0 z-40 border-b border-slate-800 bg-slate-950/80
                   backdrop-blur-md flex justify-end items-center
                   w-[calc(100%-16rem)] px-8 h-16">

      <!-- Actions + Avatar -->
      <div class="flex items-center gap-md">

        <!-- Notification bell with live badge -->
        <button class="relative p-2 text-slate-400 hover:text-indigo-300
                       hover:bg-slate-900/50 rounded-lg transition-colors">
          <span class="material-symbols-outlined">notifications</span>

          @if (alertCount.count() > 0) {
            <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                         bg-error rounded-full flex items-center justify-center
                         text-[10px] font-bold text-on-error leading-none
                         ring-2 ring-slate-950 animate-pulse">
              {{ alertCount.count() > 9 ? '9+' : alertCount.count() }}
            </span>
          } @else {
            <!-- Static dot when no alerts -->
            <span class="absolute top-2 right-2 w-2 h-2 bg-slate-600 rounded-full"></span>
          }
        </button>

        <button class="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-900/50 rounded-lg transition-colors">
          <span class="material-symbols-outlined">help</span>
        </button>

        <!-- User avatar -->
        @if (authService.currentUser$ | async; as user) {
          @if (user.photoURL) {
            <img [src]="user.photoURL" [alt]="user.displayName ?? 'User'"
                 class="w-8 h-8 rounded-full border border-indigo-500/30 object-cover ml-sm" />
          } @else {
            <div class="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-500/30
                        flex items-center justify-center text-indigo-300 text-title-md font-semibold ml-sm">
              {{ (user.displayName ?? user.email ?? '?').charAt(0).toUpperCase() }}
            </div>
          }
        }
      </div>
    </header>
  `,
})
export class TopbarComponent {
  authService = inject(AuthService);
  alertCount  = inject(AlertCountService);
}
