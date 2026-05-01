import { Injectable, signal } from '@angular/core';

/** Shared signal that keeps the notification badge count in sync
 *  between DashboardComponent and TopbarComponent. */
@Injectable({ providedIn: 'root' })
export class AlertCountService {
  count = signal(0);
}
