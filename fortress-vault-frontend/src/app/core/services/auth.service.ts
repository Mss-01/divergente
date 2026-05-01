import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth   = inject(Auth);
  private router = inject(Router);

  /** Emits the current user profile or null when signed out. */
  readonly currentUser$: Observable<UserProfile | null> = user(this.auth).pipe(
    map(u => u
      ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }
      : null
    )
  );

  /** Returns a one-time promise of the current Firebase ID token. */
  async getIdToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    return u ? u.getIdToken() : null;
  }

  /** Initiates Google Sign-In via popup. */
  signInWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(map(() => void 0));
  }

  /** Signs the user out and redirects to the login page. */
  signOut(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => { this.router.navigate(['/login']); })
    );
  }
}
