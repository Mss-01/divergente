import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col bg-black font-sans antialiased">

      <!-- TopAppBar -->
      <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center
                     px-6 h-16 bg-slate-950 border-b border-white/10">
        <div class="flex items-center gap-sm">
          <img src="logo.png" alt="Divergente" class="h-10 w-auto object-contain" />
        </div>
      </header>

      <!-- Main -->
      <main class="flex-grow flex items-center justify-center pt-16 pb-8 px-4">
        <div class="w-full max-w-md">
          <div class="border border-white/10 rounded-xl p-8 sm:p-10 backdrop-blur-sm
                      flex flex-col items-center text-center bg-surface-container"
               style="box-shadow: 0 0 50px -12px rgba(67, 97, 238, 0.5);">

            <!-- Logo -->
            <div class="w-32 h-32 flex items-center justify-center mb-6">
              <img src="logo.png" alt="Divergente"
                   class="w-full h-full object-contain drop-shadow-[0_0_24px_rgba(67,97,238,0.5)]" />
            </div>

            <h1 class="text-headline-sm text-on-surface mb-2">Secure Access</h1>
            <p class="text-body-md text-on-surface-variant mb-10 max-w-[280px]">
              Enterprise-grade security for your credentials
            </p>

            <!-- Divider -->
            <div class="w-full flex items-center gap-4 mb-8">
              <div class="h-px flex-grow bg-white/5"></div>
              <span class="text-label-sm text-outline-variant uppercase tracking-widest">Authenticate</span>
              <div class="h-px flex-grow bg-white/5"></div>
            </div>

            <!-- Loading state -->
            @if (loading) {
              <div class="w-full flex items-center justify-center gap-3 py-3 mb-4
                          bg-primary/5 border border-primary/20 rounded-lg">
                <span class="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                <span class="text-body-md text-on-surface-variant">Signing you in...</span>
              </div>
            }

            <!-- Error -->
            @if (errorMsg) {
              <div class="w-full mb-4 p-sm bg-error-container/20 border border-error/50
                          rounded-lg text-error text-body-md text-left">
                {{ errorMsg }}
              </div>
            }

            <!-- Google Sign-In button -->
            @if (!loading) {
              <button (click)="signIn()"
                      class="w-full bg-white text-gray-900 text-title-md h-12 rounded-DEFAULT
                             flex items-center justify-center gap-3 hover:bg-gray-100
                             transition-colors duration-200 active:scale-[0.98]">
                <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            }

            <!-- Security note -->
            <div class="mt-8 flex items-center justify-center gap-2 text-on-surface-variant opacity-70">
              <span class="material-symbols-outlined text-base">lock</span>
              <span class="text-label-sm">End-to-end encrypted connection</span>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="w-full py-8 flex flex-col items-center gap-4 text-center
                     bg-slate-950 border-t border-white/5">
        <div class="flex flex-wrap justify-center gap-md">
          <a href="#" class="text-slate-500 hover:text-indigo-400 transition-colors text-xs uppercase tracking-widest">Privacy Policy</a>
          <a href="#" class="text-slate-500 hover:text-indigo-400 transition-colors text-xs uppercase tracking-widest">Terms of Service</a>
        </div>
        <div class="text-slate-500 text-xs mt-2">© 2025 Divergente. Encrypted &amp; Secure.</div>
      </footer>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private fireAuth    = inject(Auth);
  private router      = inject(Router);

  loading  = true;
  errorMsg = '';

  async ngOnInit(): Promise<void> {
    // 1. Check if already logged in (e.g. session still active)
    user(this.fireAuth).pipe(take(1)).subscribe(async currentUser => {
      if (currentUser) {
        this.router.navigate(['/dashboard']);
        return;
      }

      // 2. Check if returning from a redirect sign-in
      const redirectUser = await this.authService.checkRedirectResult();
      if (redirectUser) {
        this.router.navigate(['/dashboard']);
        return;
      }

      // 3. No session, no redirect — show the login button
      this.loading = false;
    });
  }

  signIn(): void {
    this.loading  = true;
    this.errorMsg = '';

    this.authService.signInWithGoogle().subscribe({
      next: (result) => {
        if (result === 'popup_success') {
          // Popup worked — navigate immediately
          this.router.navigate(['/dashboard']);
        }
        // If 'redirect_initiated' — page will reload, ngOnInit handles it
      },
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err?.message ?? 'Authentication failed. Please try again.';
      },
    });
  }
}
