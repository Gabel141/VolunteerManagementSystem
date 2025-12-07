import { Injectable } from '@angular/core';

export interface FirebaseErrorDetails {
  code: string;
  message: string;
  userMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseErrorService {
  /**
   * Map Firebase error codes to user-friendly messages
   */
  getErrorMessage(error: any): string {
    if (!error) {
      return 'An unexpected error occurred. Please try again.';
    }

    const errorCode = error.code || error.message || '';

    const errorMap: { [key: string]: string } = {
      // Authentication errors
      'auth/invalid-email': 'The email address is not valid. Please check and try again.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email. Please sign up first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
      'auth/password-does-not-meet-requirements': 'Password does not meet Firebase security requirements. Please use at least 6 characters.',
      'auth/operation-not-allowed': 'Email/password login is not enabled. Please contact support.',
      'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
      'auth/account-exists-with-different-credential':
        'An account already exists with this email using a different login method.',
      'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
      'auth/cancelled-popup-request': 'Login cancelled. Please try again.',
      'auth/popup-blocked': 'Login popup was blocked. Please allow popups and try again.',
      'auth/popup-closed-by-user': 'You closed the login popup. Please try again.',
      'auth/unauthorized-domain': 'This domain is not authorized for authentication.',
      'auth/missing-email': 'Email is required for login.',
      'auth/missing-password': 'Password is required for login.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/invalid-api-key': 'API configuration error. Please contact support.',
      'auth/internal-error': 'An internal error occurred. Please try again later.',

      // Unverified account error
      'unverified-email': 'Your email address has not been verified yet. Please check your email for a verification link.',
      'auth/user-not-verified': 'Please verify your email address before logging in. Check your inbox for a verification link.',
    };

    return errorMap[errorCode] || `Authentication error: ${errorCode}. Please try again or contact support.`;
  }

  /**
   * Extract error code from Firebase error object
   */
  extractErrorCode(error: any): string {
    return error?.code || error?.message || 'unknown-error';
  }

  /**
   * Check if error is an unverified email error
   */
  isUnverifiedEmailError(error: any): boolean {
    const code = this.extractErrorCode(error);
    return code === 'unverified-email' || code === 'auth/user-not-verified';
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: any): boolean {
    const code = this.extractErrorCode(error);
    return code === 'auth/network-request-failed';
  }

  /**
   * Check if error is too many login attempts
   */
  isTooManyAttemptsError(error: any): boolean {
    const code = this.extractErrorCode(error);
    return code === 'auth/too-many-requests';
  }
}
