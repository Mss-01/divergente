import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { PasswordStrengthService, StrengthResult } from '../../core/services/password-strength.service';
import { AppEntry } from '../../core/models/app-entry.model';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  template: `
    <div class="flex gap-lg p-lg h-[calc(100vh-4rem)] overflow-hidden">

      <!-- ══════════════════════════════════════════
           LEFT PANEL 40%
      ══════════════════════════════════════════ -->
      <section class="w-[40%] flex flex-col bg-surface-container rounded-xl
                      border border-outline-variant overflow-hidden shadow-sm flex-shrink-0">

        <!-- Header -->
        <div class="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <h2 class="text-title-md text-on-surface">Registered Applications</h2>
          <button (click)="openNewEntryForm()"
                  class="bg-primary-container text-on-primary-container hover:bg-indigo-600
                         transition-colors rounded-lg py-xs px-sm flex items-center gap-xs text-label-sm">
            <span class="material-symbols-outlined text-base">add</span>
            Add New
          </button>
        </div>

        <!-- Search -->
        <div class="p-sm bg-surface-container">
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-sm text-on-surface-variant text-xl">search</span>
            <input type="text"
                   [ngModel]="filterQuery()"
                   (ngModelChange)="filterQuery.set($event)"
                   placeholder="Filter applications..."
                   class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                          pl-xl pr-sm py-sm text-on-surface text-body-md focus:border-primary-container
                          focus:ring-1 focus:ring-primary-container transition-all outline-none
                          placeholder-on-surface-variant" />
          </div>
        </div>

        <!-- Loading skeleton -->
        @if (loadingList()) {
          <div class="flex-1 p-xs space-y-xs">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-16 bg-surface-container-high rounded-lg animate-pulse mx-xs"></div>
            }
          </div>
        }

        <!-- App list -->
        @if (!loadingList()) {
          <div class="flex-1 overflow-y-auto p-xs space-y-xs">
            @for (app of filteredApps(); track app.id) {
              <div (click)="selectApp(app)"
                   class="flex items-center gap-md p-sm rounded-lg cursor-pointer relative overflow-hidden transition-all border"
                   [class.bg-surface-container-highest]="selectedApp()?.id === app.id"
                   [class.border-outline]="selectedApp()?.id === app.id"
                   [class.border-transparent]="selectedApp()?.id !== app.id"
                   [class.hover:bg-surface-container-high]="selectedApp()?.id !== app.id">
                @if (selectedApp()?.id === app.id) {
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-container rounded-r-sm"></div>
                }
                <!-- Favicon -->
                <div class="w-10 h-10 rounded-lg bg-surface-variant border border-outline-variant
                            flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img [src]="getFavicon(app.url)"
                       [alt]="app.appName"
                       class="w-6 h-6 object-contain"
                       (error)="onFaviconError($event)" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-title-md text-on-surface truncate">{{ app.appName }}</h3>
                  <p class="text-body-md text-on-surface-variant truncate text-xs">{{ app.url }}</p>
                </div>
                <!-- Strength dot -->
                <span class="w-2 h-2 rounded-full flex-shrink-0"
                      [style.background-color]="strengthColor(app.strength)"></span>
              </div>
            }
            @if (apps().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-2">
                <span class="material-symbols-outlined text-4xl">lock_open</span>
                <p class="text-body-md">No applications yet</p>
                <p class="text-label-sm">Click "Add New" to get started</p>
              </div>
            }
          </div>
        }
      </section>

      <!-- ══════════════════════════════════════════
           RIGHT PANEL 60%
      ══════════════════════════════════════════ -->
      <section class="w-[60%] flex flex-col bg-surface-container-low rounded-xl
                      border border-outline-variant overflow-y-auto shadow-sm">

        <!-- ── NEW ENTRY FORM ── -->
        @if (showNewForm()) {
          <div class="p-xl border-b border-outline-variant flex items-center gap-lg bg-surface-container flex-shrink-0">
            <!-- Live favicon preview from URL input -->
            <div class="w-16 h-16 rounded-xl bg-surface-variant border border-outline-variant
                        flex items-center justify-center overflow-hidden shadow-inner">
              @if (newAppUrl()) {
                <img [src]="getFavicon(newAppUrl())"
                     class="w-10 h-10 object-contain"
                     (error)="onFaviconError($event)" />
              } @else {
                <span class="material-symbols-outlined text-on-surface-variant text-[32px]">add_circle</span>
              }
            </div>
            <div class="flex-1">
              <h2 class="text-headline-sm text-on-surface">
                {{ newAppName() || 'New Application' }}
              </h2>
              <p class="text-body-md text-on-surface-variant mt-xs">
                {{ newAppUrl() || 'Add a new credential to your vault' }}
              </p>
            </div>
            <button (click)="cancelNewForm()"
                    class="p-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest
                           rounded-lg transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-xl flex flex-col gap-lg">
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">App Name *</label>
              <input type="text"
                     [ngModel]="newAppName()"
                     (ngModelChange)="newAppName.set($event)"
                     placeholder="e.g. Instagram"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">URL *</label>
              <input type="text"
                     [ngModel]="newAppUrl()"
                     (ngModelChange)="newAppUrl.set($event)"
                     placeholder="e.g. instagram.com"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>
            <div class="flex flex-col gap-xs">
              <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">Username / Email *</label>
              <input type="text"
                     [ngModel]="newAppUsername()"
                     (ngModelChange)="newAppUsername.set($event)"
                     placeholder="e.g. user@company.com"
                     class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                            p-sm text-on-surface text-body-md focus:border-primary-container
                            focus:ring-1 focus:ring-primary-container outline-none transition-all" />
            </div>

            <div class="h-px w-full bg-outline-variant/50"></div>

            <!-- Password section -->
            <ng-container [ngTemplateOutlet]="pwdSection"></ng-container>
          </div>
        }

        <!-- ── EXISTING APP DETAIL ── -->
        @if (selectedApp(); as app) {
          <!-- Header with live favicon -->
          <div class="p-xl border-b border-outline-variant flex items-center gap-lg bg-surface-container flex-shrink-0">
            <div class="w-16 h-16 rounded-xl bg-surface-variant border border-outline-variant
                        flex items-center justify-center overflow-hidden shadow-inner">
              <img [src]="getFavicon(app.url)"
                   [alt]="app.appName"
                   class="w-10 h-10 object-contain"
                   (error)="onFaviconError($event)" />
            </div>
            <div class="flex-1">
              <h2 class="text-headline-sm text-on-surface">{{ app.appName }}</h2>
              <div class="flex items-center gap-sm mt-xs">
                <span class="px-sm py-[2px] rounded-full bg-primary-fixed/10 border border-primary-fixed/20
                             text-primary-fixed text-label-sm">Active</span>
                <span class="text-body-md text-on-surface-variant">{{ app.url }}</span>
              </div>
            </div>
            <button (click)="confirmDelete(app)"
                    class="p-sm text-on-surface-variant hover:text-error hover:bg-error/10
                           rounded-lg transition-colors border border-transparent hover:border-error/20">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>

          <div class="p-xl flex flex-col gap-xl">
            <!-- Username -->
            <div class="flex flex-col gap-sm">
              <h3 class="text-title-md text-on-surface">General Information</h3>
              <div class="flex flex-col gap-xs">
                <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">Username / Email</label>
                <div class="relative">
                  <input type="text" [value]="app.username" readonly
                         class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                                p-sm text-on-surface text-body-md opacity-80 cursor-default focus:outline-none" />
                  <button (click)="copyToClipboard(app.username, 'username')"
                          class="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant
                                 hover:text-on-surface transition-colors p-xs">
                    <span class="material-symbols-outlined text-xl">
                      {{ copiedField() === 'username' ? 'check' : 'content_copy' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div class="h-px w-full bg-outline-variant/50"></div>

            <!-- Current password -->
            <div class="flex flex-col gap-sm">
              <h3 class="text-title-md text-on-surface">Current Credentials</h3>
              @if (loadingDetail()) {
                <div class="h-12 bg-surface-container-high rounded-lg animate-pulse"></div>
              } @else {
                <div class="flex flex-col gap-xs">
                  <label class="text-label-sm text-on-surface-variant uppercase tracking-wider">Stored Password</label>
                  <div class="flex gap-sm">
                    <div class="relative flex-1">
                      <input [type]="showPassword() ? 'text' : 'password'"
                             [value]="currentPassword()" readonly
                             class="w-full bg-surface-container-highest border border-outline-variant rounded-lg
                                    p-sm text-on-surface text-body-md tracking-widest focus:outline-none font-mono" />
                      <button (click)="togglePassword()"
                              class="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant
                                     hover:text-on-surface transition-colors p-xs bg-surface-container-highest">
                        <span class="material-symbols-outlined text-xl">
                          {{ showPassword() ? 'visibility_off' : 'visibility' }}
                        </span>
                      </button>
                    </div>
                    <button (click)="copyToClipboard(currentPassword(), 'password')"
                            class="bg-surface-variant border border-outline-variant text-on-surface
                                   hover:bg-surface-container-highest transition-colors rounded-lg
                                   px-md py-sm flex items-center justify-center">
                      <span class="material-symbols-outlined text-xl">
                        {{ copiedField() === 'password' ? 'check' : 'content_copy' }}
                      </span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <div class="h-px w-full bg-outline-variant/50"></div>

            <!-- Password section -->
            <ng-container [ngTemplateOutlet]="pwdSection"></ng-container>
          </div>
        }

        <!-- ── EMPTY STATE ── -->
        @if (!selectedApp() && !showNewForm()) {
          <div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4">
            <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center
                        border border-outline-variant">
              <span class="material-symbols-outlined text-4xl">lock</span>
            </div>
            <p class="text-title-md text-on-surface">Select an application</p>
            <p class="text-body-md">Choose an app from the list or click "Add New".</p>
          </div>
        }

      </section>
    </div>

    <!-- ══════════════════════════════════════════
         SHARED PASSWORD GENERATOR TEMPLATE
         Uses signals so computed() re-evaluates on every keystroke
    ══════════════════════════════════════════ -->
    <ng-template #pwdSection>
      <div class="flex flex-col gap-md bg-surface-container rounded-xl p-lg
                  border border-primary-container/30 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r
                    from-primary-container via-secondary to-primary-container opacity-50"></div>

        <div class="flex items-center justify-between">
          <h3 class="text-title-md text-on-surface flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary-container">psychiatry</span>
            Generate Secure Password
          </h3>
          <button type="button" (click)="generatePassword()"
                  class="text-primary hover:text-primary-container text-label-sm
                         transition-colors flex items-center gap-xs">
            <span class="material-symbols-outlined text-base">refresh</span>
            Generate
          </button>
        </div>

        <!-- Password input — uses signal via (ngModelChange) for real-time updates -->
        <div class="relative">
          <input type="text"
                 [ngModel]="newPassword()"
                 (ngModelChange)="onPasswordChange($event)"
                 placeholder="Type or generate a password..."
                 class="w-full bg-surface-container-lowest border border-primary-container/50 rounded-lg
                        p-md text-on-surface text-body-lg tracking-wider focus:border-primary-container
                        focus:ring-1 focus:ring-primary-container transition-all outline-none font-mono" />
        </div>

        <!-- Real-time strength meter — only shown when password has content -->
        @if (newPassword()) {
          <div class="flex flex-col gap-sm">

            <!-- Label row -->
            <div class="flex justify-between items-center text-label-sm">
              <span class="text-on-surface-variant uppercase tracking-wider">Strength</span>
              <span class="font-bold text-sm" [style.color]="sr().hexColor">
                {{ sr().strength }}
              </span>
            </div>

            <!-- Segmented bar — 4 segments, fills left to right based on score -->
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

            <!-- Metrics row -->
            <div class="flex justify-between items-center mt-xs flex-wrap gap-2">
              <div class="flex items-center gap-xs text-on-surface-variant text-body-md">
                <span class="material-symbols-outlined text-base">timer</span>
                <span>Time to Crack:
                  <strong class="text-on-surface">{{ sr().crackTimeDisplay }}</strong>
                </span>
              </div>
              <div class="flex items-center gap-xs text-on-surface-variant text-body-md
                          bg-surface-container-highest px-sm py-xs rounded-md border border-outline-variant/50">
                <span class="material-symbols-outlined text-base">event</span>
                <span>Expiration:
                  <strong class="text-on-surface">{{ sr().expirationDays }} Days</strong>
                </span>
              </div>
            </div>

          </div>
        }

        <!-- Security Violation alert -->
        @if (securityViolation()) {
          <div class="mt-sm bg-error-container/20 border border-error/50 rounded-lg p-sm flex items-start gap-sm">
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

        <!-- Save button -->
        <button type="button" (click)="savePassword()"
                [disabled]="!newPassword() || saving() || !canSaveNew()"
                class="mt-md w-full bg-primary-container text-on-primary-container hover:bg-indigo-600
                       transition-colors duration-200 rounded-lg py-md px-lg flex items-center
                       justify-center gap-sm text-title-md shadow-md active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed">
          <span class="material-symbols-outlined">{{ saving() ? 'progress_activity' : 'save' }}</span>
          {{ saving() ? 'Saving...' : 'Save New Password' }}
        </button>
      </div>
    </ng-template>
  `,
})
export class VaultComponent implements OnInit {
  private api         = inject(ApiService);
  private strengthSvc = inject(PasswordStrengthService);

  // ── Signals (all reactive) ────────────────────────────────────────────────
  apps              = signal<AppEntry[]>([]);
  selectedApp       = signal<AppEntry | null>(null);
  currentPassword   = signal('');
  loadingList       = signal(true);
  loadingDetail     = signal(false);
  showNewForm       = signal(false);
  showPassword      = signal(false);
  copiedField       = signal<string | null>(null);
  securityViolation = signal(false);
  saving            = signal(false);

  // Form fields as signals so computed() reacts to them
  filterQuery   = signal('');
  newPassword   = signal('');
  newAppName    = signal('');
  newAppUrl     = signal('');
  newAppUsername = signal('');

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Full zxcvbn result — re-evaluates on every keystroke because newPassword is a signal */
  sr = computed<StrengthResult & { hexColor: string }>(() => {
    const base = this.strengthSvc.evaluate(this.newPassword());
    const hexColor =
      base.score >= 3 ? '#4ade80' :
      base.score === 2 ? '#fb923c' : '#f87171';
    return { ...base, hexColor };
  });

  filteredApps = computed(() => {
    const q = this.filterQuery().toLowerCase();
    return this.apps().filter(a => a.appName.toLowerCase().includes(q));
  });

  /** For new entry form: all three fields must be filled */
  canSaveNew = computed(() =>
    !this.showNewForm() ||
    (!!this.newAppName() && !!this.newAppUrl() && !!this.newAppUsername())
  );

  ngOnInit(): void { this.loadApps(); }

  // ── Data ──────────────────────────────────────────────────────────────────

  loadApps(): void {
    this.loadingList.set(true);
    this.api.getApps().subscribe({
      next: apps => { this.apps.set(apps); this.loadingList.set(false); },
      error: ()  => this.loadingList.set(false),
    });
  }

  selectApp(app: AppEntry): void {
    this.showNewForm.set(false);
    this.selectedApp.set(app);
    this.newPassword.set('');
    this.securityViolation.set(false);
    this.showPassword.set(false);
    this.loadDetail(app.id!);
  }

  loadDetail(id: string): void {
    this.loadingDetail.set(true);
    this.currentPassword.set('');
    this.api.getApp(id).subscribe({
      next: full => { this.currentPassword.set(full.encryptedPassword); this.loadingDetail.set(false); },
      error: ()  => this.loadingDetail.set(false),
    });
  }

  openNewEntryForm(): void {
    this.selectedApp.set(null);
    this.showNewForm.set(true);
    this.newPassword.set('');
    this.newAppName.set('');
    this.newAppUrl.set('');
    this.newAppUsername.set('');
    this.securityViolation.set(false);
  }

  cancelNewForm(): void {
    this.showNewForm.set(false);
    this.newPassword.set('');
  }

  // ── UI actions ────────────────────────────────────────────────────────────

  /** Called by (ngModelChange) on the password input — updates the signal */
  onPasswordChange(value: string): void {
    this.newPassword.set(value);
    this.securityViolation.set(false);
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField.set(field);
      setTimeout(() => this.copiedField.set(null), 2000);
    });
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
    const arr   = new Uint32Array(20);
    crypto.getRandomValues(arr);
    this.newPassword.set(Array.from(arr, n => chars[n % chars.length]).join(''));
    this.securityViolation.set(false);
  }

  savePassword(): void {
    if (!this.newPassword() || this.saving()) return;
    const existing = this.selectedApp();
    if (!existing && (!this.newAppName() || !this.newAppUrl() || !this.newAppUsername())) return;

    this.saving.set(true);
    this.securityViolation.set(false);

    const s = this.sr();
    const payload = {
      appName:          existing ? existing.appName  : this.newAppName(),
      url:              existing ? existing.url       : this.newAppUrl(),
      username:         existing ? existing.username  : this.newAppUsername(),
      password:         this.newPassword(),
      strength:         s.strength,
      crackTimeSeconds: s.crackTimeSeconds,
    };

    const req$ = existing
      ? this.api.updateApp(existing.id!, payload)
      : this.api.createApp(payload);

    req$.subscribe({
      next: saved => {
        this.saving.set(false);
        this.newPassword.set('');
        this.loadApps();
        if (existing) {
          this.loadDetail(existing.id!);
        } else {
          this.showNewForm.set(false);
          setTimeout(() => this.selectApp(saved), 400);
        }
      },
      error: err => {
        this.saving.set(false);
        if (err?.type === 'SECURITY_VIOLATION') this.securityViolation.set(true);
      },
    });
  }

  confirmDelete(app: AppEntry): void {
    if (!confirm(`Delete "${app.appName}"? This cannot be undone.`)) return;
    this.api.deleteApp(app.id!).subscribe({
      next: () => { this.selectedApp.set(null); this.loadApps(); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns the Google favicon service URL for a given domain.
   * Works for any site: instagram.com, github.com, etc.
   */
  getFavicon(url: string): string {
    if (!url) return '';
    // Strip protocol if present
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  /** Fallback to a lock icon when favicon fails to load */
  onFaviconError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // Insert fallback icon next to the broken image
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.favicon-fallback')) {
      const span = document.createElement('span');
      span.className = 'material-symbols-outlined text-on-surface-variant favicon-fallback';
      span.textContent = 'lock';
      parent.appendChild(span);
    }
  }

  strengthColor(strength: string): string {
    if (strength === 'Strong') return '#4ade80';
    if (strength === 'Medium') return '#fb923c';
    return '#f87171';
  }
}
