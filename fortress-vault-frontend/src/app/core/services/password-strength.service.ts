import { Injectable } from '@angular/core';
import zxcvbn from 'zxcvbn';
import { PasswordStrength } from '../models/app-entry.model';

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  strength: PasswordStrength;
  /** Human-readable crack time (uses dot as decimal separator) */
  crackTimeDisplay: string;
  /** Crack time in seconds (raw number) */
  crackTimeSeconds: number;
  /** Expiration in days derived from crack time (capped at 90) */
  expirationDays: number;
  /** CSS color class for the strength bar */
  colorClass: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordStrengthService {

  evaluate(password: string): StrengthResult {
    if (!password) {
      return this.emptyResult();
    }

    const result = zxcvbn(password);
    const score  = result.score as 0 | 1 | 2 | 3 | 4;

    // crack_time_seconds.offline_slow_hashing_1e4_per_second is the most
    // conservative (and realistic for bcrypt) estimate.
    const crackSec = result.crack_times_seconds.offline_slow_hashing_1e4_per_second as number;

    return {
      score,
      strength:         this.scoreToStrength(score),
      crackTimeDisplay: this.formatCrackTime(crackSec),
      crackTimeSeconds: crackSec,
      expirationDays:   this.calcExpirationDays(crackSec),
      colorClass:       this.scoreToColorClass(score),
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private scoreToStrength(score: number): PasswordStrength {
    if (score >= 3) return 'Strong';
    if (score === 2) return 'Medium';
    return 'Weak';
  }

  private scoreToColorClass(score: number): string {
    if (score >= 3) return 'bg-[#4ade80]';   // green
    if (score === 2) return 'bg-[#fb923c]';  // orange
    return 'bg-[#f87171]';                   // red
  }

  /**
   * Formats crack time in seconds to a human-readable string.
   * Always uses a dot (.) as the decimal separator.
   */
  private formatCrackTime(seconds: number): string {
    if (seconds < 60)          return `${seconds.toFixed(1)} seconds`;
    if (seconds < 3600)        return `${(seconds / 60).toFixed(1)} minutes`;
    if (seconds < 86400)       return `${(seconds / 3600).toFixed(1)} hours`;
    if (seconds < 2592000)     return `${(seconds / 86400).toFixed(1)} days`;
    if (seconds < 31536000)    return `${(seconds / 2592000).toFixed(1)} months`;
    const years = seconds / 31536000;
    if (years < 1_000_000)     return `${years.toFixed(1)} years`;
    return `${(years / 1_000_000).toFixed(1)}M years`;
  }

  /**
   * Maps crack time in seconds to an expiration window in days.
   * Cap: 90 days (enterprise policy).
   */
  private calcExpirationDays(crackSec: number): number {
    const days = crackSec / 86400;
    if (days < 7)   return 7;
    if (days < 30)  return 14;
    if (days < 365) return 30;
    return 90;
  }

  private emptyResult(): StrengthResult {
    return {
      score:            0,
      strength:         'Weak',
      crackTimeDisplay: '—',
      crackTimeSeconds: 0,
      expirationDays:   0,
      colorClass:       'bg-[#f87171]',
    };
  }
}
