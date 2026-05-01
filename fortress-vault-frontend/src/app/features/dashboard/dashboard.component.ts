import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AlertCountService } from '../../core/services/alert-count.service';
import { AppEntry, VaultStats } from '../../core/models/app-entry.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="px-margin py-lg max-w-7xl mx-auto space-y-gutter">

      <!-- Page Header -->
      <header class="mb-lg">
        <h2 class="text-headline-sm text-on-surface mb-xs">Dashboard Overview</h2>
        <p class="text-body-md text-on-surface-variant">Monitor your vault security and application access.</p>
      </header>

      <!-- ── Expiring Soon Alert Banner ── -->
      @if (expiringApps().length > 0) {
        <div class="flex flex-col gap-xs">
          @for (item of expiringApps(); track item.app.id) {
            <div class="flex items-center gap-md px-lg py-sm rounded-xl border
                        transition-all duration-300 group"
                 [class.border-error/40]="item.daysLeft <= 2"
                 [class.bg-error/5]="item.daysLeft <= 2"
                 [class.border-tertiary/40]="item.daysLeft > 2"
                 [class.bg-tertiary/5]="item.daysLeft > 2">

              <!-- Favicon -->
              <div class="w-8 h-8 rounded-md bg-surface-container-high border border-white/10
                          flex items-center justify-center overflow-hidden flex-shrink-0">
                <img [src]="getFavicon(item.app.url)"
                     [alt]="item.app.appName"
                     class="w-5 h-5 object-contain"
                     (error)="onFaviconError($event)" />
              </div>

              <!-- Message -->
              <div class="flex-1 min-w-0">
                <span class="text-body-md font-medium"
                      [class.text-error]="item.daysLeft <= 2"
                      [class.text-tertiary]="item.daysLeft > 2">
                  {{ item.app.appName }}
                </span>
                <span class="text-body-md text-on-surface-variant ml-2">
                  {{ item.daysLeft <= 1 ? 'expires tomorrow — rotate now' : 'expires in ' + item.daysLeft + ' days' }}
                </span>
              </div>

              <!-- Days badge -->
              <span class="text-label-sm font-bold px-sm py-xs rounded-full flex-shrink-0"
                    [class.bg-error/15]="item.daysLeft <= 2"
                    [class.text-error]="item.daysLeft <= 2"
                    [class.bg-tertiary/15]="item.daysLeft > 2"
                    [class.text-tertiary]="item.daysLeft > 2">
                {{ item.daysLeft }}d left
              </span>

              <!-- Action -->
              <button [routerLink]="['/vault']"
                      class="text-label-sm px-sm py-xs rounded-lg border transition-colors flex-shrink-0"
                      [class.border-error/40]="item.daysLeft <= 2"
                      [class.text-error]="item.daysLeft <= 2"
                      [class.hover:bg-error/10]="item.daysLeft <= 2"
                      [class.border-tertiary/40]="item.daysLeft > 2"
                      [class.text-tertiary]="item.daysLeft > 2"
                      [class.hover:bg-tertiary/10]="item.daysLeft > 2">
                Rotate
              </button>

              <!-- Dismiss -->
              <button (click)="dismissAlert(item.app.id!)"
                      class="p-xs text-on-surface-variant hover:text-on-surface transition-colors
                             opacity-0 group-hover:opacity-100 flex-shrink-0">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- ── Metric Cards ── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">

        <!-- Card A: Total Applications -->
        <div class="bg-surface-container border border-white/5 rounded-xl p-lg relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="flex justify-between items-start mb-md relative z-10">
            <div class="p-sm bg-surface-container-highest rounded-lg border border-white/5">
              <span class="material-symbols-outlined text-primary text-xl">apps</span>
            </div>
            <span class="text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full border border-white/5">
              Total
            </span>
          </div>
          <div class="relative z-10">
            <p class="text-body-md text-on-surface-variant mb-xs">Total Applications</p>
            @if (loading()) {
              <div class="h-14 w-16 bg-surface-container-high rounded-lg animate-pulse"></div>
            } @else {
              <p class="text-display-lg text-on-surface">{{ stats()?.total ?? 0 }}</p>
            }
          </div>
        </div>

        <!-- Card B: Security Health -->
        <div class="bg-surface-container border border-white/5 rounded-xl p-lg relative overflow-hidden group">
          <div class="flex justify-between items-start mb-md">
            <div class="p-sm bg-surface-container-highest rounded-lg border border-white/5">
              <span class="material-symbols-outlined text-tertiary-fixed text-xl">health_and_safety</span>
            </div>
            <span class="text-label-sm text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              {{ healthLabel() }}
            </span>
          </div>
          <div class="flex items-center gap-lg">
            <!-- Donut chart -->
            <div class="relative w-24 h-24 flex-shrink-0">
              <div class="w-full h-full rounded-full" [style]="donutStyle()"></div>
              <div class="absolute inset-2 bg-surface-container rounded-full flex items-center justify-center">
                <span class="text-title-md text-on-surface">{{ healthPct() }}%</span>
              </div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center justify-between text-label-sm">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                  <span class="text-on-surface-variant">Strong</span>
                </div>
                <span class="text-on-surface">{{ stats()?.strong ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between text-label-sm">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#fb923c]"></span>
                  <span class="text-on-surface-variant">Medium</span>
                </div>
                <span class="text-on-surface">{{ stats()?.medium ?? 0 }}</span>
              </div>
              <div class="flex items-center justify-between text-label-sm">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#f87171]"></span>
                  <span class="text-on-surface-variant">Weak</span>
                </div>
                <span class="text-on-surface">{{ stats()?.weak ?? 0 }}</span>
              </div>
            </div>
          </div>
          <div class="mt-md pt-sm border-t border-white/5">
            <p class="text-body-md text-on-surface-variant mb-xs">Security Health</p>
          </div>
        </div>

        <!-- Card C: Critical Actions -->
        <div class="bg-surface-container border border-error/20 rounded-xl p-lg relative overflow-hidden group shadow-[0_0_15px_rgba(255,180,171,0.05)]">
          <div class="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="flex justify-between items-start mb-md relative z-10">
            <div class="p-sm bg-error-container rounded-lg border border-error/20">
              <span class="material-symbols-outlined text-error text-xl">warning</span>
            </div>
            <span class="text-label-sm text-error bg-error/10 px-2 py-1 rounded-full border border-error/20">
              Action Required
            </span>
          </div>
          <div class="relative z-10">
            <p class="text-body-md text-on-surface-variant mb-xs">Passwords Expiring Soon</p>
            <div class="flex items-end gap-3 mb-4">
              @if (loading()) {
                <div class="h-14 w-10 bg-error/20 rounded-lg animate-pulse"></div>
              } @else {
                <p class="text-display-lg text-error">{{ stats()?.expiringSoon ?? 0 }}</p>
              }
              <p class="text-body-md text-on-surface-variant pb-2">Expiring soon</p>
            </div>
            <button [routerLink]="['/vault']"
                    class="w-full bg-surface-container-high hover:bg-surface-bright text-on-surface
                           text-title-md py-2 rounded-lg border border-white/5 transition-colors
                           flex items-center justify-center gap-2">
              Review Now
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

      </div>

      <!-- ── Applications Table ── -->
      <div class="bg-surface-container border border-white/5 rounded-xl overflow-hidden mt-xl">

        <!-- Toolbar -->
        <div class="p-lg border-b border-white/5 flex flex-col sm:flex-row justify-between
                    items-start sm:items-center gap-4 bg-surface-container-low">
          <div>
            <h3 class="text-title-md text-on-surface">Applications Status</h3>
            <p class="text-label-sm text-on-surface-variant mt-1">Manage and audit individual application credentials.</p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative focus-within:ring-2 focus-within:ring-primary/50 rounded-md w-full sm:w-64">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input type="text"
                     [ngModel]="filterQuery()"
                     (ngModelChange)="filterQuery.set($event)"
                     placeholder="Filter apps..."
                     class="w-full bg-surface-container-high border border-white/10 rounded-md py-1.5
                            pl-9 pr-3 text-sm text-on-surface placeholder-on-surface-variant
                            focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
        </div>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="p-lg space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="h-12 bg-surface-container-high rounded-lg animate-pulse"></div>
            }
          </div>
        }

        <!-- Error state -->
        @if (error()) {
          <div class="p-lg flex items-center gap-3 text-error">
            <span class="material-symbols-outlined">error</span>
            <p class="text-body-md">{{ error() }}</p>
            <button (click)="loadData()" class="ml-auto text-primary text-body-md hover:underline">Retry</button>
          </div>
        }

        <!-- Table -->
        @if (!loading() && !error()) {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-white/5 bg-surface-container-lowest/50">
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Application</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Identity</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Strength</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold">Expiration</th>
                  <th class="text-label-sm text-on-surface-variant uppercase tracking-wider py-3 px-lg font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (app of filteredApps(); track app.id) {
                  <tr class="hover:bg-surface-container-high transition-colors group"
                      [class.bg-error/5]="app.strength === 'Weak'">
                    <td class="py-md px-lg">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-md bg-surface-bright flex items-center justify-center
                                    border flex-shrink-0 overflow-hidden"
                             [class.border-white/10]="app.strength !== 'Weak'"
                             [class.border-error/30]="app.strength === 'Weak'">
                          <img [src]="getFavicon(app.url)"
                               [alt]="app.appName"
                               class="w-5 h-5 object-contain"
                               (error)="onFaviconError($event)" />
                        </div>
                        <span class="text-title-md text-on-surface">{{ app.appName }}</span>
                      </div>
                    </td>
                    <td class="py-md px-lg">
                      <span class="text-body-md text-on-surface-variant">{{ app.username }}</span>
                    </td>
                    <td class="py-md px-lg">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm"
                            [class]="strengthChipClass(app.strength)">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="strengthDotClass(app.strength)"></span>
                        {{ app.strength }}
                      </span>
                    </td>
                    <td class="py-md px-lg">
                      <div class="flex flex-col gap-1 w-36">
                        <div class="flex justify-between text-label-sm">
                          <span [class]="app.strength === 'Weak' ? 'text-error' : 'text-on-surface-variant'">
                            {{ expirationLabel(app) }}
                          </span>
                          <span [class]="app.strength === 'Weak' ? 'text-error font-bold' : 'text-on-surface-variant'">
                            {{ daysUntilExpiration(app) }}
                          </span>
                        </div>
                        <div class="w-full h-1.5 bg-surface-bright rounded-full overflow-hidden">
                          <div class="h-full rounded-full" [style.width]="expirationPct(app) + '%'"
                               [class]="strengthBarClass(app.strength)"></div>
                        </div>
                      </div>
                    </td>
                    <td class="py-md px-lg text-right">
                      @if (app.strength === 'Weak') {
                        <button [routerLink]="['/vault']"
                                class="text-error text-sm px-3 py-1 rounded border border-error/50
                                       bg-error/10 hover:bg-error/20 transition-all">
                          Rotate Now
                        </button>
                      } @else {
                        <button [routerLink]="['/vault']"
                                class="text-primary opacity-0 group-hover:opacity-100 transition-all text-sm
                                       px-3 py-1 rounded border border-primary/20 hover:bg-primary/10">
                          Edit
                        </button>
                      }
                    </td>
                  </tr>
                }
                @if (filteredApps().length === 0 && apps().length > 0) {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-on-surface-variant text-body-md">
                      No applications match your filter.
                    </td>
                  </tr>
                }
                @if (apps().length === 0) {
                  <tr>
                    <td colspan="5" class="py-12 text-center">
                      <div class="flex flex-col items-center gap-3 text-on-surface-variant">
                        <span class="material-symbols-outlined text-4xl">lock_open</span>
                        <p class="text-body-md">No applications yet.</p>
                        <button [routerLink]="['/vault']"
                                class="text-primary text-body-md hover:underline flex items-center gap-1">
                          <span class="material-symbols-outlined text-base">add</span>
                          Add your first entry
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private api             = inject(ApiService);
  private notificationSvc = inject(NotificationService);
  private alertCount      = inject(AlertCountService);

  apps           = signal<AppEntry[]>([]);
  stats          = signal<VaultStats | null>(null);
  loading        = signal(true);
  error          = signal<string | null>(null);
  expiringApps   = signal<Array<{ app: AppEntry; daysLeft: number }>>([]);
  dismissedIds   = signal<Set<string>>(new Set());
  filterQuery    = signal('');

  filteredApps = computed(() =>
    this.apps().filter(a =>
      a.appName.toLowerCase().includes(this.filterQuery().toLowerCase())
    )
  );

  healthPct = computed(() => {
    const s = this.stats();
    if (!s || s.total === 0) return 0;
    return Math.round((s.strong / s.total) * 100);
  });

  healthLabel = computed(() => {
    const p = this.healthPct();
    if (p >= 80) return 'Good';
    if (p >= 50) return 'Fair';
    return 'Poor';
  });

  donutStyle = computed(() => {
    const s = this.stats();
    if (!s || s.total === 0) return 'background: #282932';
    const strongPct = (s.strong / s.total) * 100;
    const medPct    = (s.medium / s.total) * 100;
    return `background: conic-gradient(#4ade80 0% ${strongPct}%, #fb923c ${strongPct}% ${strongPct + medPct}%, #f87171 ${strongPct + medPct}% 100%)`;
  });

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getApps().subscribe({
      next: apps => {
        this.apps.set(apps);
        this.computeStats(apps);

        // Compute expiring apps for in-app banner
        const expiring = this.notificationSvc.getExpiringApps(apps, 7);
        this.expiringApps.set(expiring);
        this.alertCount.count.set(expiring.length);

        // Fire browser push notifications
        this.notificationSvc.notifyExpiring(apps, 7);

        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.message ?? 'Failed to load data. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  dismissAlert(appId: string): void {
    this.expiringApps.update(list => list.filter(i => i.app.id !== appId));
    this.alertCount.count.set(this.expiringApps().length);
  }

  private computeStats(apps: AppEntry[]): void {
    const now      = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const s: VaultStats = { total: apps.length, strong: 0, medium: 0, weak: 0, expiringSoon: 0 };
    for (const a of apps) {
      if (a.strength === 'Strong')      s.strong++;
      else if (a.strength === 'Medium') s.medium++;
      else                              s.weak++;
      if (a.expirationDate && new Date(a.expirationDate) < sevenDays) s.expiringSoon++;
    }
    this.stats.set(s);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  strengthChipClass(s: string): string {
    if (s === 'Strong') return 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20';
    if (s === 'Medium') return 'bg-[#fb923c]/10 text-[#fb923c] border border-[#fb923c]/20';
    return 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20';
  }

  strengthDotClass(s: string): string {
    if (s === 'Strong') return 'bg-[#4ade80]';
    if (s === 'Medium') return 'bg-[#fb923c]';
    return 'bg-[#f87171]';
  }

  strengthBarClass(s: string): string {
    if (s === 'Strong') return 'bg-[#4ade80]';
    if (s === 'Medium') return 'bg-[#fb923c]';
    return 'bg-[#f87171]';
  }

  expirationLabel(app: AppEntry): string {
    if (!app.expirationDate) return 'No expiry';
    const days = this.daysLeft(app);
    if (days <= 0)  return 'Expired';
    if (days <= 7)  return 'Critical';
    if (days <= 30) return 'Aging';
    return 'Secure';
  }

  daysUntilExpiration(app: AppEntry): string {
    if (!app.expirationDate) return '—';
    const days = this.daysLeft(app);
    if (days <= 0)       return 'Expired';
    if (days < 365)      return `${days}d`;
    return `${Math.round(days / 365)}y`;
  }

  expirationPct(app: AppEntry): number {
    if (!app.expirationDate || !app.lastUpdated) return 50;
    const total   = new Date(app.expirationDate).getTime() - new Date(app.lastUpdated).getTime();
    const elapsed = Date.now() - new Date(app.lastUpdated).getTime();
    const pct     = 100 - Math.round((elapsed / total) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  private daysLeft(app: AppEntry): number {
    return Math.ceil((new Date(app.expirationDate!).getTime() - Date.now()) / 86400000);
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
    if (parent && !parent.querySelector('.favicon-fallback')) {
      const span = document.createElement('span');
      span.className = 'material-symbols-outlined text-on-surface-variant favicon-fallback text-sm';
      span.textContent = 'lock';
      parent.appendChild(span);
    }
  }
}
