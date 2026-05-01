import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  user
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth   = inject(Auth);
  private router = inject(Router);

  readonly currentUser$: Observable<UserProfile | null> = user(this.auth).pipe(
    map(u => u
      ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }
      : null
    )
  );

  async getIdToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    return u ? u.getIdToken() : null;
  }

  /**
   * Try popup first. If blocked by browser, fall back to redirect.
   */
  signInWithGoogle(): Observable<'popup_success' | 'redirect_initiated'> {
    const provider = new GoogleAuthProvider();
    return new Observable(observer => {
      signInWithPopup(this.auth, provider)
        .then(() => {
          observer.next('popup_success');
          observer.complete();
        })
        .catch(err => {
          // Popup was blocked or closed — fall back to redirect
          if (
            err?.code === 'auth/popup-blocked' ||
            err?.code === 'auth/popup-closed-by-user' ||
            err?.code === 'auth/cancelled-popup-request'
          ) {
            signInWithRedirect(this.auth, provider)
              .then(() => {
                observer.next('redirect_initiated');
                observer.complete();
              })
              .catch(redirectErr => observer.error(redirectErr));
          } else {
            observer.error(err);
          }
        });
    });
  }

  /**
   * Check if we're returning from a redirect sign-in.
   * Returns the user if found, null otherwise.
   */
  async checkRedirectResult(): Promise<UserProfile | null> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        return {
          uid:         result.user.uid,
          email:       result.user.email,
          displayName: result.user.displayName,
          photoURL:    result.user.photoURL,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => { this.router.navigate(['/login']); })
    );
  }
}
