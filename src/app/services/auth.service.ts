import { inject, Injectable, signal } from "@angular/core";
import { Auth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
        updateProfile,
        user,
        sendEmailVerification,
}
from "@angular/fire/auth";
import { from, Observable, throwError } from "rxjs";
import { UserInterface } from "./user.interface";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    firebaseAuth = inject(Auth)
    user$ = user(this.firebaseAuth);
    currentUserSig = signal<UserInterface | null | undefined>(undefined)

    /**
     * Register a new user with email and password
     * Sends verification email after successful registration
     */
    register(email: string, username: string, password: string): Observable<void> {
        // Log registration attempt for debugging
        console.log('=== REGISTRATION ATTEMPT ===');
        console.log('Email:', email);
        console.log('Username:', username);
        console.log('Password length:', password ? password.length : 0);
        console.log('Password (first/last chars visible):', password ? `${password.charAt(0)}***${password.charAt(password.length - 1)}` : 'EMPTY');
        console.log('Calling Firebase: createUserWithEmailAndPassword(auth, email, password)');

        const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password)
            .then(response => {
                console.log('✅ Firebase registration successful for user:', response.user.uid);
                // Update display name
                return updateProfile(response.user, { displayName: username })
                    .then(() => {
                        console.log('✅ Profile updated with displayName:', username);
                        // Send verification email
                        return sendEmailVerification(response.user);
                    })
                    .then(() => {
                        console.log('✅ Verification email sent to:', email);
                    })
                    .catch(error => {
                        // Handle updateProfile or sendEmailVerification errors
                        console.error('❌ Error in updateProfile or sendEmailVerification:', error);
                        throw this.handleAuthError(error);
                    });
            })
            .catch(error => {
                // Pass Firebase error to error handler
                console.error('❌ Firebase registration failed:', error);
                throw this.handleAuthError(error);
            });

        return from(promise);
    }

    /**
     * Login user with email and password
     * Checks if email is verified before allowing login
     */
    login(email: string, password: string): Observable<void> {
        const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
            .then(response => {
                // Check if email is verified
                if (!response.user.emailVerified) {
                    // Sign them out immediately
                    return signOut(this.firebaseAuth)
                        .then(() => {
                            const error = new Error('Email not verified');
                            (error as any).code = 'auth/user-not-verified';
                            throw error;
                        });
                }
                return Promise.resolve();
            })
            .catch(error => {
                throw this.handleAuthError(error);
            });

        return from(promise);
    }

    /**
     * Logout the current user
     */
    logout(): Observable<void> {
        const promise = signOut(this.firebaseAuth);
        return from(promise);
    }

    /**
     * Resend verification email to current user
     */
    resendVerificationEmail(): Observable<void> {
        const currentUser = this.firebaseAuth.currentUser;
        if (!currentUser) {
            return throwError(() => new Error('No user logged in'));
        }

        const promise = sendEmailVerification(currentUser)
            .catch(error => {
                throw this.handleAuthError(error);
            });

        return from(promise);
    }

    /**
     * Handle Firebase authentication errors
     */
    private handleAuthError(error: any): any {
        console.error('=== FIREBASE AUTH ERROR ===');
        console.error('Full Error Object:', error);
        console.error('Error Code:', error?.code);
        console.error('Error Message:', error?.message);
        console.error('Error Name:', error?.name);

        // Log additional properties for debugging
        if (error?.customData) {
            console.error('Custom Data:', error.customData);
        }

        if (error?.response) {
            console.error('HTTP Response:', error.response);
        }

        // Extract error code from Firebase error
        const errorCode = error?.code || '';

        // Map Firebase errors - keep error codes intact for error service mapping
        const validErrorCodes: { [key: string]: boolean } = {
            'auth/invalid-email': true,
            'auth/user-disabled': true,
            'auth/user-not-found': true,
            'auth/wrong-password': true,
            'auth/email-already-in-use': true,
            'auth/weak-password': true,
            'auth/password-does-not-meet-requirements': true,
            'auth/operation-not-allowed': true,
            'auth/too-many-requests': true,
            'auth/network-request-failed': true,
            'auth/account-exists-with-different-credential': true,
            'auth/invalid-credential': true,
            'auth/internal-error': true,
            'auth/missing-email': true,
            'auth/missing-password': true,
        };

        // Create error object with proper code
        const customError = new Error(error?.message || 'Authentication failed');
        // Preserve the original error code exactly as Firebase returned it
        (customError as any).code = validErrorCodes[errorCode] ? errorCode : (errorCode || 'auth/internal-error');

        console.error('Processed Error Code:', (customError as any).code);

        return customError;
    }
}
