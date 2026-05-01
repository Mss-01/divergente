import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewEntryModalService } from '../../../core/services/new-entry-modal.service';
import { ApiService } from '../../../core/services/api.service';
import { PasswordStrengthService, StrengthResult } from '../../../core/services/password-strength.service';

@Component({
  selector: 'app-new-entry-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (modal.isOpen()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4"
           (click)="onBackdropClick($event)">

        <!-- Blur overlay -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal card -->
        <div class="relative z-10 w-full max-w-lg bg-surface-container border border-outline-variant
                    rounded-xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh] overflow-hidden"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center gap-md p-xl border-b border-outline-variant bg-surface-container-high flex-shrink-0">
            <div class="w-12 h-12 rounded-xl bg-surface-variant border border-outline-variant
                        flex items-center justify-center overflow-hidden flex-shrink-0">
              @if (appUrl()) {
                <img [src]="getFavicon(appUrl())" class="w-8 h-8 object-contain"
                     (error)="onFaviconError($event)" />
              } @else {
                <span class="material-symbols-outlined text-on-surface-variant">add_circle</span>
              }
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-headline-sm text-on-surface truncate">
                {{ appName() || 'New Application' }}
              </h2>
              <p class="text-body-md text-on-surface-variant">
                {{ appUrl() || 'Add a new credential to your vault' }}
              </p>
            </div>
            <button (click)="close()"
                    class="p-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest
                           rounded-lg transition-colors flex-shrink-0">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="overflow-y-auto flex-1 p-xl flex flex-col gap-lg">

            <!-- App Name -->
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">App Name *</label>
              <input type="text"
                     [ngModel]="appName()"
                     (ngModelChange)="appName.set($event)"
                     placeholder="e.g. Instagram"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>

            <!-- URL -->
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">URL *</label>
              <input type="text"
                     [ngModel]="appUrl()"
                     (ngModelChange)="appUrl.set($event)"
                     placeholder="e.g. instagram.com"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>

            <!-- Username -->
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">Username / Email *</label>
              <input type="text"
                     [ngModel]="appUsername()"
                     (ngModelChange)="appUsername.set($event)"
                     placeholder="e.g. user@company.com"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>

            <div class="h-px w-full bg-outline-variant/50"></div>

            <!-- Password generator -->
            <div class="flex flex-col gap-md bg-surface-container-low rounded-xl p-lg
                        border border-primary-container/30 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r
                          from-primary-container via-secondary to-primary-container opacity-50"></div>

              <div class="flex items-center justify-between">
                <h3 class="text-title-md text-on-surface flex items-center gap-sm">
                  <span class="material-symbols-outlined text-primary-container">psychiatry</span>
                  Set Password
                </h3>
                <button type="button" (click)="generatePassword()"
                        class="text-primary hover:text-primary-container text-label-sm
                               transition-colors flex items-center gap-xs">
                  <span class="material-symbols-outlined text-base">refresh</span>
                  Generate
                </button>
              </div>

              <!-- Password input -->
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'"
                       [ngModel]="password()"
                       (ngModelChange)="onPasswordChange($event)"
                       placeholder="Type or generate a password..."
                       class="w-full bg-surface-container-lowest border border-primary-container/50 rounded-lg
                              p-md pr-12 text-on-surface text-body-lg tracking-wider focus:border-primary-container
                              focus:ring-1 focus:ring-primary-container transition-all outline-none font-mono" />
                <button type="button" (click)="showPassword.update(v => !v)"
                        class="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant
                               hover:text-on-surface transition-colors p-xs">
                  <span class="material-symbols-outlined text-xl">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>

              <!-- Real-time strength meter -->
              @if (password()) {
                <div class="flex flex-col gap-sm">
                  <div class="flex justify-between items-center text-label-sm">
                    <span class="text-on-surface-variant uppercase tracking-wider">Strength</span>
                    <span class="font-bold" [style.color]="sr().hexColor">{{ sr().strength }}</span>
                  </div>
                  <div class="flex gap-1 h-2 w-full">
                    <div class="h-full flex-1 rounded-l-full transition-all duration-300"
                         [style.background-color]="sr().score >= 1 ? sr().hexColor : '#282932'"></div>
                    <div class="h-full flex-1 transition-all duration-300"
                         [style.background-color]="sr().score >= 2 ? sr().hexColor : '#282932'"></div>
                    <div class="h-full flex-1 transition-all duration-300"
                         [style.background-color]="sr().score >= 3 ? sr().hexColor : '#282932'"></div>
                    <div class="h-full flex-1 rounded-r-full transition-all duration-300"
                         [style.background-color]="sr().score >= 4 ? sr().hexColor : '#282932'"></div>
                  </div>
                  <div class="flex justify-between items-center mt-xs flex-wrap gap-2">
                    <div class="flex items-center gap-xs text-on-surface-variant text-body-md">
                      <span class="material-symbols-outlined text-base">timer</span>
                      <span>Time to Crack: <strong class="text-on-surface">{{ sr().crackTimeDisplay }}</strong></span>
                    </div>
                    <div class="flex items-center gap-xs text-on-surface-variant text-body-md
                                bg-surface-container-highest px-sm py-xs rounded-md border border-outline-variant/50">
                      <span class="material-symbols-outlined text-base">event</span>
                      <span>Expiration: <strong class="text-on-surface">{{ sr().expirationDays }} Days</strong></span>
                    </div>
                  </div>
                </div>
              }

              <!-- Security Violation -->
              @if (securityViolation()) {
                <div class="bg-error-container/20 border border-error/50 rounded-lg p-sm flex items-start gap-sm">
                  <span class="material-symbols-outlined text-error mt-[2px] text-xl">warning</span>
                  <div>
                    <span class="text-title-md text-error">Security Violation Detected</span>
                    <p class="text-body-md text-on-error-container mt-xs opacity-90">
                      This password has already been used for another application.
                      Reuse is strictly prohibited by enterprise policy.
                    </p>
                  </div>
                </div>
              }

              <!-- Success message -->
              @if (saved()) {
                <div class="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-lg p-sm flex items-center gap-sm">
                  <span class="material-symbols-outlined text-[#4ade80] text-xl">check_circle</span>
                  <span class="text-body-md text-[#4ade80] font-medium">
                    Application saved successfully!
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-sm p-xl border-t border-outline-variant
                      bg-surface-container flex-shrink-0">
            <button type="button" (click)="close()"
                    class="px-lg py-sm rounded-lg border border-outline-variant text-on-surface-variant
                           hover:text-on-surface hover:bg-surface-container-highest transition-colors text-body-md">
              Cancel
            </button>
            <button type="button" (click)="save()"
                    [disabled]="!canSave() || saving()"
                    class="px-lg py-sm rounded-lg bg-primary-container text-on-primary-container
                           hover:bg-indigo-600 transition-colors text-body-md font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs">
              <span class="material-symbols-outlined text-base">
                {{ saving() ? 'progress_activity' : 'save' }}
              </span>
              {{ saving() ? 'Saving...' : 'Save Entry' }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class NewEntryModalComponent {
  modal       = inject(NewEntryModalService);
  private api = inject(ApiService);
  private strengthSvc = inject(PasswordStrengthService);

  // ── Form signals ──────────────────────────────────────────────────────────
  appName    = signal('');
  appUrl     = signal('');
  appUsername = signal('');
  password   = signal('');
  showPassword      = signal(false);
  securityViolation = signal(false);
  saving     = signal(false);
  saved      = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  sr = computed<StrengthResult & { hexColor: string }>(() => {
    const base = this.strengthSvc.evaluate(this.password());
    const hexColor =
      base.score >= 3 ? '#4ade80' :
      base.score === 2 ? '#fb923c' : '#f87171';
    return { ...base, hexColor };
  });

  canSave = computed(() =>
    !!this.appName() && !!this.appUrl() && !!this.appUsername() && !!this.password() && !this.saving()
  );

  // ── Keyboard shortcut: Escape closes modal ────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.modal.isOpen()) this.close(); }

  // ── Actions ───────────────────────────────────────────────────────────────
  close(): void {
    this.modal.close();
    this.reset();
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('fixed')) this.close();
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    this.securityViolation.set(false);
    this.saved.set(false);
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
    const arr   = new Uint32Array(20);
    crypto.getRandomValues(arr);
    this.password.set(Array.from(arr, n => chars[n % chars.length]).join(''));
    this.securityViolation.set(false);
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.securityViolation.set(false);

    const s = this.sr();
    this.api.createApp({
      appName:          this.appName(),
      url:              this.appUrl(),
      username:         this.appUsername(),
      password:         this.password(),
      strength:         s.strength,
      crackTimeSeconds: s.crackTimeSeconds,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        // Auto-close after 1.2s so user sees the success message
        setTimeout(() => this.close(), 1200);
      },
      error: err => {
        this.saving.set(false);
        if (err?.type === 'SECURITY_VIOLATION') this.securityViolation.set(true);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getFavicon(url: string): string {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  onFaviconError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fav-fb')) {
      const span = document.createElement('span');
      span.className = 'material-symbols-outlined text-on-surface-variant fav-fb';
      span.textContent = 'lock';
      parent.appendChild(span);
    }
  }

  private reset(): void {
    this.appName.set('');
    this.appUrl.set('');
    this.appUsername.set('');
    this.password.set('');
    this.showPassword.set(false);
    this.securityViolation.set(false);
    this.saving.set(false);
    this.saved.set(false);
  }
}
