import { Injectable } from '@angular/core';
import { AppEntry } from '../models/app-entry.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  /** Request permission on first call. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  /**
   * Checks all apps and fires a browser notification for each one
   * that expires within the next `thresholdDays` days.
   * Deduplicates using sessionStorage so the same notification
   * doesn't fire twice in the same browser session.
   */
  async notifyExpiring(apps: AppEntry[], thresholdDays = 7): Promise<void> {
    const granted = await this.requestPermission();
    if (!granted) return;

    const now       = Date.now();
    const threshold = thresholdDays * 24 * 60 * 60 * 1000;

    for (const app of apps) {
      if (!app.expirationDate) continue;

      const expMs    = new Date(app.expirationDate).getTime();
      const diffMs   = expMs - now;
      const daysLeft = Math.ceil(diffMs / 86400000);

      if (diffMs <= 0 || diffMs > threshold) continue;

      // Deduplicate: only notify once per app per day
      const key = `notified_${app.id}_${new Date().toDateString()}`;
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, '1');

      const title = daysLeft <= 1
        ? `⚠️ ${app.appName} — Password expires today!`
        : `🔐 ${app.appName} — Password expiring soon`;

      const body = daysLeft <= 0
        ? `Your password for ${app.appName} has expired. Update it now to stay secure.`
        : daysLeft === 1
          ? `Your password for ${app.appName} expires tomorrow. Rotate it now.`
          : `Your password for ${app.appName} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Consider updating it.`;

      const notification = new Notification(title, {
        body,
        icon:  `https://www.google.com/s2/favicons?domain=${this.extractDomain(app.url)}&sz=64`,
        badge: '/favicon.ico',
        tag:   `fortress-vault-${app.id}`,   // groups duplicate notifications
        requireInteraction: daysLeft <= 1,   // stays until dismissed if critical
        data:  { appId: app.id, url: app.url },
      });

      // Click → focus the app tab
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  /** Show a single in-app toast-style notification (fallback when push is denied) */
  getExpiringApps(apps: AppEntry[], thresholdDays = 7): Array<{ app: AppEntry; daysLeft: number }> {
    const now       = Date.now();
    const threshold = thresholdDays * 24 * 60 * 60 * 1000;

    return apps
      .filter(a => {
        if (!a.expirationDate) return false;
        const diff = new Date(a.expirationDate).getTime() - now;
        return diff > 0 && diff <= threshold;
      })
      .map(a => ({
        app:      a,
        daysLeft: Math.ceil((new Date(a.expirationDate!).getTime() - now) / 86400000),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }

  private extractDomain(url: string): string {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}
