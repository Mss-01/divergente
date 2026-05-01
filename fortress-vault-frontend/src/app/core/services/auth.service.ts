import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

  /** Uses redirect instead of popup — works on all browsers without popup blockers */
  signInWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithRedirect(this.auth, provider)).pipe(map(() => void 0));
  }

  /** Call this on app init to handle the redirect result after Google login */
  handleRedirectResult(): Observable<boolean> {
    return from(getRedirectResult(this.auth)).pipe(
      map(result => !!result?.user)
    );
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => { this.router.navigate(['/login']); })
    );
  }
}
