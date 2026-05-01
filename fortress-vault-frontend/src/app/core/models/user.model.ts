/**
 * Authenticated user profile derived from Firebase Auth.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
