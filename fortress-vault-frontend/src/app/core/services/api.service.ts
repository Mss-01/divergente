import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AppEntry, AppEntryRequest, VaultStats } from '../models/app-entry.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private base        = environment.apiUrl;

  private authHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getIdToken()).pipe(
      switchMap(token => [
        new HttpHeaders({
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token ?? ''}`,
        }),
      ])
    );
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    if (err.status === 409) {
      return throwError(() => ({ type: 'SECURITY_VIOLATION', message: 'Security Violation Detected' }));
    }
    const msg = err.error?.error ?? err.message ?? 'Unknown error';
    return throwError(() => ({ type: 'API_ERROR', message: msg, status: err.status }));
  }

  // ── Apps ──────────────────────────────────────────────────────────────────

  getApps(): Observable<AppEntry[]> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.get<AppEntry[]>(`${this.base}/apps`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  getApp(id: string): Observable<AppEntry> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.get<AppEntry>(`${this.base}/apps/${id}`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  createApp(payload: AppEntryRequest): Observable<AppEntry> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.post<AppEntry>(`${this.base}/apps`, payload, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  updateApp(id: string, payload: AppEntryRequest): Observable<AppEntry> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.put<AppEntry>(`${this.base}/apps/${id}`, payload, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  deleteApp(id: string): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.delete<void>(`${this.base}/apps/${id}`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): Observable<VaultStats> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.get<VaultStats>(`${this.base}/stats`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  // ── Security Audit ────────────────────────────────────────────────────────

  runAuditScan(): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.get<any>(`${this.base}/audit/scan`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }

  getAuditStatus(): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(h => this.http.get<any>(`${this.base}/audit/status`, { headers: h })),
      catchError(e => this.handleError(e))
    );
  }
}
