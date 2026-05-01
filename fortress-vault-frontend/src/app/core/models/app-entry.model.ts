/**
 * Represents a single application credential entry stored in Firestore.
 * Maps to: users/{userId}/apps/{appId}
 */
export interface AppEntry {
  id?: string;
  appName: string;
  url: string;
  username: string;
  /** AES-256 encrypted password (stored in Firestore, decrypted by backend) */
  encryptedPassword: string;
  /** SHA-256 hash used for uniqueness validation across all user apps */
  passwordHash: string;
  strength: PasswordStrength;
  /** Estimated seconds to brute-force crack the password */
  crackTimeSeconds: number;
  expirationDate: Date | null;
  lastUpdated: Date;
}

export type PasswordStrength = 'Strong' | 'Medium' | 'Weak';

/**
 * DTO sent to the backend when creating or updating an app entry.
 */
export interface AppEntryRequest {
  appName: string;
  url: string;
  username: string;
  /** Plain-text password — encrypted server-side */
  password: string;
  /** Strength computed by zxcvbn on the frontend */
  strength?: string;
  /** Crack time in seconds computed by zxcvbn */
  crackTimeSeconds?: number;
}

/**
 * Dashboard statistics aggregated by the backend.
 */
export interface VaultStats {
  total: number;
  strong: number;
  medium: number;
  weak: number;
  expiringSoon: number; // entries expiring in < 7 days
}
