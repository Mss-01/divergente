import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface AuditResult {
  id?: string;
  appName: string;
  url: string;
  username: string;
  strength: string;
  isCompromised: boolean;
  breachDetails: string;
  lastUpdated: Date;
}

interface AuditSummary {
  totalScanned: number;
  totalCompromised: number;
  scannedAt: Date;
  results: AuditResult[];
}

@Component({
  selector: 'app-security-audit',
  standalone: true,
  imports: [],
  template: `
    <div class="px-margin py-lg max-w-7xl mx-auto space-y-gutter">

      <!-- Page Header -->
      <header class="mb-lg flex items-start justify-between">
        <div>
          <h2 class="text-headline-sm text-on-surface mb-xs flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary">security</span>
            Security Audit
          </h2>
          <p class="text-body-md text-on-surface-variant">
            Monitor your registered accounts against known data breach databases.
          </p>
        </div>
        <button (click)="runScan()"
                [disabled]="scanning()"
                class="flex items-center gap-sm px-lg py-sm bg-primary-container text-on-primary-container
                       hover:bg-indigo-600 transition-colors rounded-lg text-title-md font-medium
                       disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 shadow-md">
          <span class="material-symbols-outlined text-base"
                [class.animate-spin]="scanning()">
            {{ scanning() ? 'progress_activity' : 'radar' }}
          </span>
          {{ scanning() ? 'Scanning...' : 'Run Scan' }}
        </button>
      </header>

      <!-- Scanning progress banner -->
      @if (scanning()) {
        <div class="bg-primary/5 border border-primary/20 rounded-xl p-lg flex items-center gap-md">
          <span class="material-symbols-outlined text-primary animate-spin">progress_activity</span>
          <div>
            <p class="text-title-md text-on-surface">Scanning your accounts...</p>
            <p class="text-body-md text-on-surface-variant mt-xs">
              Checking against Have I Been Pwned database. This may take a moment.
            </p>
          </div>
        </div>
      }

      <!-- Summary Cards -->
      @if (summary()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">

          <!-- Total Scanned -->
          <div class="bg-surface-container border border-white/5 rounded-xl p-lg">
            <div class="flex justify-between items-start mb-md">
              <div class="p-sm bg-surface-container-highest rounded-lg border border-white/5">
                <span class="material-symbols-outlined text-primary text-xl">manage_search</span>
              </div>
              <span class="text-label-sm text-on-surface-variant bg-surface-container-high
                           px-2 py-1 rounded-full border border-white/5">
                Last scan: {{ formatDate(summary()!.scannedAt) }}
              </span>
            </div>
            <p class="text-body-md text-on-surface-variant mb-xs">Accounts Scanned</p>
            <p class="text-display-lg text-on-surface">{{ summary()!.totalScanned }}</p>
          </div>

          <!-- Compromised -->
          <div class="bg-surface-container rounded-xl p-lg relative overflow-hidden"
               [class.border]="true"
               [class.border-error/30]="summary()!.totalCompromised > 0"
               [class.border-white/5]="summary()!.totalCompromised === 0">
            @if (summary()!.totalCompromised > 0) {
              <div class="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent"></div>
            }
            <div class="flex justify-between items-start mb-md relative z-10">
              <div class="p-sm rounded-lg border"
                   [class.bg-error-container]="summary()!.totalCompromised > 0"
                   [class.border-error/20]="summary()!.totalCompromised > 0"
                   [class.bg-surface-container-highest]="summary()!.totalCompromised === 0"
                   [class.border-white/5]="summary()!.totalCompromised === 0">
                <span class="material-symbols-outlined text-xl"
                      [class.text-error]="summary()!.totalCompromised > 0"
                      [class.text-[#4ade80]]="summary()!.totalCompromised === 0">
                  {{ summary()!.totalCompromised > 0 ? 'gpp_bad' : 'verified_user' }}
                </span>
              </div>
              <span class="text-label-sm px-2 py-1 rounded-full border"
                    [class.text-error]="summary()!.totalCompromised > 0"
                    [class.bg-error/10]="summary()!.totalCompromised > 0"
                    [class.border-error/20]="summary()!.totalCompromised > 0"
                    [class.text-[#4ade80]]="summary()!.totalCompromised === 0"
                    [class.bg-[#4ade80]/10]="summary()!.totalCompromised === 0"
                    [class.border-[#4ade80]/20]="summary()!.totalCompromised === 0">
                {{ summary()!.totalCompromised > 0 ? 'Action Required' : 'All Clear' }}
              </span>
            </div>
            <div class="relative z-10">
              <p class="text-body-md text-on-surface-variant mb-xs">Compromised Accounts</p>
              <p class="text-display-lg"
                 [class.text-error]="summary()!.totalCompromised > 0"
                 [class.text-[#4ade80]]="summary()!.totalCompromised === 0">
                {{ summary()!.totalCompromised }}
              </p>
            </div>
          </div>

          <!-- Safe -->
          <div class="bg-surface-container border border-white/5 rounded-xl p-lg">
            <div class="flex justify-between items-start mb-md">
              <div class="p-sm bg-surface-container-highest rounded-lg border border-white/5">
                <span class="material-symbols-outlined text-[#4ade80] text-xl">shield_check</span>
              </div>
              <span class="text-label-sm text-[#4ade80] bg-[#4ade80]/10 px-2 py-1 rounded-full border border-[#4ade80]/20">
                Secure
              </span>
            </div>
            <p class="text-body-md text-on-surface-variant mb-xs">Safe Accounts</p>
            <p class="text-display-lg text-on-surface">
              {{ summary()!.totalScanned - summary()!.totalCompromised }}
            </p>
          </div>

        </div>

        <!-- Results Table -->
        <div class="bg-surface-container border border-white/5 rounded-xl overflow-hidden mt-xl">
          <div class="p-lg border-b border-white/5 bg-surface-container-low flex justify-between items-center">
            <div>
              <h3 class="text-title-md text-on-surface">Scan Results</h3>
              <p class="text-label-sm text-on-surface-variant mt-1">
                {{ compromisedResults().length }} compromised
                · {{ safeResults().length }} secure
              </p>
            </div>
            <!-- Filter tabs -->
            <div class="flex items-center gap-xs bg-surface-container-high rounded-lg p-xs border border-white/5">
              <button (click)="activeFilter.set('all')"
                      class="px-sm py-xs rounded-md text-label-sm transition-colors"
                      [class.bg-primary-container]="activeFilter() === 'all'"
                      [class.text-on-primary-container]="activeFilter() === 'all'"
                      [class.text-on-surface-variant]="activeFilter() !== 'all'">
                All ({{ summary()!.totalScanned }})
              </button>
              <button (click)="activeFilter.set('compromised')"
                      class="px-sm py-xs rounded-md text-label-sm transition-colors"
                      [class.bg-error]="activeFilter() === 'compromised'"
                      [class.text-on-error]="activeFilter() === 'compromised'"
                      [class.text-on-surface-variant]="activeFilter() !== 'compromised'">
                Compromised ({{ compromisedResults().length }})
              </button>
              <button (click)="activeFilter.set('safe')"
                      class="px-sm py-xs rounded-md text-label-sm transition-colors"
                      [class.bg-[#4ade80]/20]="activeFilter() === 'safe'"
                      [class.text-[#4ade80]]="activeFilter() === 'safe'"
                      [class.text-on-surface-variant]="activeFilter() !== 'safe'">
                Safe ({{ safeResults().length }})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-white/5 bg-surface-container-lowest/50">
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Application</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Account</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Status</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Breach Details</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (result of filteredResults(); track result.id) {
                  <tr class="hover:bg-surface-container-high transition-colors group"
                      [class.bg-error/5]="result.isCompromised">
                    <td class="py-md px-lg">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-md bg-surface-bright flex items-center justify-center
                                    border overflow-hidden flex-shrink-0"
                             [class.border-error/30]="result.isCompromised"
                             [class.border-white/10]="!result.isCompromised">
                          <img [src]="getFavicon(result.url)"
                               [alt]="result.appName"
                               class="w-5 h-5 object-contain"
                               (error)="onFaviconError($event)" />
                        </div>
                        <span class="text-title-md text-on-surface">{{ result.appName }}</span>
                      </div>
                    </td>
                    <td class="py-md px-lg">
                      <span class="text-body-md text-on-surface-variant">{{ result.username }}</span>
                    </td>
                    <td class="py-md px-lg">
                      @if (result.isCompromised) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                     bg-error/10 text-error border border-error/20 text-label-sm">
                          <span class="material-symbols-outlined text-sm">gpp_bad</span>
                          Compromised
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                     bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 text-label-sm">
                          <span class="material-symbols-outlined text-sm">verified_user</span>
                          Secure
                        </span>
                      }
                    </td>
                    <td class="py-md px-lg">
                      @if (result.isCompromised && result.breachDetails) {
                        <span class="text-body-md text-error/80">{{ result.breachDetails }}</span>
                      } @else {
                        <span class="text-body-md text-on-surface-variant opacity-40">—</span>
                      }
                    </td>
                    <td class="py-md px-lg text-right">
                      @if (result.isCompromised) {
                        <button (click)="rotatePassword(result)"
                                class="inline-flex items-center gap-xs text-error text-sm px-3 py-1
                                       rounded border border-error/50 bg-error/10 hover:bg-error/20
                                       transition-all font-medium">
                          <span class="material-symbols-outlined text-sm">autorenew</span>
                          Rotate Now
                        </button>
                      } @else {
                        <span class="text-on-surface-variant text-label-sm opacity-0 group-hover:opacity-60">
                          No action needed
                        </span>
                      }
                    </td>
                  </tr>
                }
                @if (filteredResults().length === 0) {
                  <tr>
                    <td colspan="5" class="py-12 text-center">
                      <div class="flex flex-col items-center gap-3 text-on-surface-variant">
                        <span class="material-symbols-outlined text-4xl">verified_user</span>
                        <p class="text-body-md">No results in this category.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Empty state — no scan yet -->
      @if (!summary() && !scanning()) {
        <div class="bg-surface-container border border-white/5 rounded-xl p-xl flex flex-col
                    items-center justify-center text-center gap-lg min-h-[400px]">
          <div class="w-24 h-24 rounded-full bg-surface-container-high border border-outline-variant
                      flex items-center justify-center">
            <span class="material-symbols-outlined text-5xl text-on-surface-variant">radar</span>
          </div>
          <div>
            <h3 class="text-headline-sm text-on-surface mb-xs">No Scan Performed Yet</h3>
            <p class="text-body-md text-on-surface-variant max-w-md">
              Run a scan to check if any of your registered accounts appear in known data breaches.
              We use the Have I Been Pwned database with k-Anonymity to protect your privacy.
            </p>
          </div>
          <button (click)="runScan()"
                  class="flex items-center gap-sm px-xl py-md bg-primary-container text-on-primary-container
                         hover:bg-indigo-600 transition-colors rounded-lg text-title-md font-medium
                         active:scale-95 shadow-md">
            <span class="material-symbols-outlined">radar</span>
            Start Security Scan
          </button>
          <p class="text-label-sm text-on-surface-variant opacity-60">
            Only the first 5 characters of each email hash are sent externally — your data stays private.
          </p>
        </div>
      }

    </div>
  `,
})
export class SecurityAuditComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);

  summary      = signal<AuditSummary | null>(null);
  scanning     = signal(false);
  activeFilter = signal<'all' | 'compromised' | 'safe'>('all');

  compromisedResults = computed(() =>
    this.summary()?.results.filter(r => r.isCompromised) ?? []
  );

  safeResults = computed(() =>
    this.summary()?.results.filter(r => !r.isCompromised) ?? []
  );

  filteredResults = computed(() => {
    const s = this.summary();
    if (!s) return [];
    switch (this.activeFilter()) {
      case 'compromised': return this.compromisedResults();
      case 'safe':        return this.safeResults();
      default:            return s.results;
    }
  });

  ngOnInit(): void {
    // Load persisted status on mount (no re-scan)
    this.loadStatus();
  }

  loadStatus(): void {
    this.api.getAuditStatus().subscribe({
      next: data => {
        if (data.totalScanned > 0) this.summary.set(data);
      },
      error: () => { /* no scan yet — show empty state */ },
    });
  }

  runScan(): void {
    this.scanning.set(true);
    this.api.runAuditScan().subscribe({
      next: data => {
        this.summary.set(data);
        this.scanning.set(false);
        this.activeFilter.set('all');
      },
      error: () => this.scanning.set(false),
    });
  }

  rotatePassword(result: AuditResult): void {
    // Navigate to vault — the vault will show the app list
    // In a future iteration this can preselect the specific app
    this.router.navigate(['/vault']);
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  getFavicon(url: string): string {
    if (!url) return '';
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  onFaviconError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fav-fb')) {
      const span = document.createElement('span');
      span.className = 'material-symbols-outlined text-on-surface-variant fav-fb text-sm';
      span.textContent = 'lock';
      parent.appendChild(span);
    }
  }
}
