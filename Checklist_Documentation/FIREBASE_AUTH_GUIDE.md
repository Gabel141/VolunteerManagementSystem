# Firebase Authentication Implementation Guide

## Overview

This document describes the complete Firebase Authentication integration for the Volunteer Management System, featuring modal-based login and sign-up flows with email verification.

## Architecture

### Services

#### 1. **AuthService** (`src/app/services/auth.service.ts`)
Core authentication service managing all Firebase Auth operations.

**Key Methods:**

- `register(email, username, password)`: Creates new user account
  - Validates email format and password strength
  - Sets username as displayName
  - Automatically sends verification email
  - Returns Observable<void>

- `login(email, password)`: Authenticates user
  - Validates credentials with Firebase
  - **Blocks unverified users** from logging in
  - Throws `auth/user-not-verified` if email not verified
  - Requires email verification before access

- `logout()`: Signs out current user
  - Clears Firebase session
  - Returns Observable<void>

- `resendVerificationEmail()`: Resends verification email
  - Only works for currently authenticated users
  - Useful if user didn't receive initial email

**State Management:**
- `currentUserSig`: Angular Signal storing logged-in user
  - Type: `signal<UserInterface | null | undefined>`
  - Updated in real-time from Firebase
  - Used by navbar for conditional rendering

#### 2. **ModalService** (`src/app/services/modal.service.ts`)
Manages modal visibility state across the application.

**Key Methods:**
- `openModal(id)`: Shows modal by ID
- `closeModal(id)`: Hides modal by ID
- `toggleModal(id)`: Toggles modal visibility
- `isOpen(id)`: Returns boolean for template binding
- `closeAllModals()`: Closes all open modals

#### 3. **FirebaseErrorService** (`src/app/services/firebase-error.service.ts`)
Maps Firebase error codes to user-friendly messages.

**Error Categories:**

| Category | Error Code | User Message |
|----------|-----------|--------------|
| Invalid Email | `auth/invalid-email` | "The email address is not valid. Please check and try again." |
| User Not Found | `auth/user-not-found` | "No account found with this email. Please sign up first." |
| Wrong Password | `auth/wrong-password` | "Incorrect password. Please try again." |
| Email in Use | `auth/email-already-in-use` | "This email is already registered. Please sign in or use a different email." |
| Weak Password | `auth/weak-password` | "Password is too weak. Please use at least 6 characters with a mix of letters and numbers." |
| Account Disabled | `auth/user-disabled` | "This account has been disabled. Please contact support." |
| Too Many Requests | `auth/too-many-requests` | "Too many failed login attempts. Please try again later." |
| Network Error | `auth/network-request-failed` | "Network error. Please check your internet connection and try again." |
| Unverified Email | `auth/user-not-verified` | "Please verify your email address before logging in. Check your inbox for a verification link." |

## Components

### 1. LoginModal (`src/app/modals/login-modal/`)

**Purpose:** Authentication entry point for existing users

**Features:**
- Email and password input with validation
- Real-time form validation feedback
- Custom error messages from Firebase
- Loading spinner during authentication
- Modal-to-modal transition (Login → Signup)
- Auto-reset on close

**Form Validation:**
```typescript
form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
});
```

**Key Behaviors:**
- Displays Firebase error messages (e.g., "Wrong password", "User not found")
- Shows special message if email not verified
- Closes modal on successful login
- Redirects to home page after login
- Clears error on manual close

### 2. SignupModal (`src/app/modals/signup-modal/`)

**Purpose:** User registration with email verification setup

**Features:**
- Username, email, password, and confirm password inputs
- Password matching validation
- Automatic verification email after signup
- Success message with 2-second delay
- Auto-transition to login modal
- Real-time validation feedback

**Form Validation:**
```typescript
form = this.fb.nonNullable.group({
  username: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  confirmPassword: ['', Validators.required],
});
```

**Key Behaviors:**
- Validates username (min 3 characters)
- Validates email format
- Validates password strength (min 6 characters)
- Checks password confirmation match
- Sends verification email after registration
- Displays success message: "Account created! Please check your email to verify your account."
- Auto-switches to login modal after 2 seconds
- Shows Firebase error if email already registered

## Authentication Flow

### Complete User Journey

#### 1. New User Sign-Up Flow
```
Home Page (Unauthenticated)
    ↓
[Click "Sign Up" button]
    ↓
SignupModal Opens
    ↓
User Fills Form:
  - Username (min 3 chars)
  - Email (valid format)
  - Password (min 6 chars)
  - Confirm Password (must match)
    ↓
[Click "Sign Up" button]
    ↓
AuthService.register() called
    ↓
Firebase Creates User Account
    ↓
Username set as displayName
    ↓
Verification Email Sent to User
    ↓
Success Message Shown (2 sec)
    ↓
SignupModal Auto-Closes
    ↓
LoginModal Opens Automatically
    ↓
User Sees: "Verification email sent. Check your email."
```

#### 2. Email Verification Flow
```
User Receives Email
    ↓
[Click verification link in email]
    ↓
Firebase marks email as verified
    ↓
Email verified in Firebase Console
```

#### 3. Existing User Login Flow
```
Home Page (Unauthenticated)
    ↓
[Click "Login" button]
    ↓
LoginModal Opens
    ↓
User Enters:
  - Email
  - Password
    ↓
[Click "Sign In" button]
    ↓
AuthService.login() called
    ↓
Firebase validates credentials
    ↓
Check: Email verified?
    ├─ NO → Sign user out immediately
    │       ↓
    │       Show: "Please verify your email address..."
    │       ↓
    │       Stay on LoginModal
    │
    └─ YES → Allow login
            ↓
            LoginModal Closes
            ↓
            Redirect to Home (/)
            ↓
            Navbar Updates to show:
              - Create Event link
              - Profile link
              - Logout button
```

#### 4. Logout Flow
```
Authenticated User
    ↓
[Click "Logout" button in navbar]
    ↓
AuthService.logout() called
    ↓
Firebase session cleared
    ↓
currentUserSig set to null
    ↓
Redirect to Home (/)
    ↓
Navbar Updates to show:
  - Login button
  - Sign Up button
```

## Error Handling Examples

### Example 1: Wrong Password
```
User: Enters email "john@example.com" and wrong password
Firebase Error: { code: 'auth/wrong-password' }
User Sees: "Incorrect password. Please try again."
Result: Stays on LoginModal, can retry
```

### Example 2: Email Already Registered
```
User: Tries to sign up with existing email
Firebase Error: { code: 'auth/email-already-in-use' }
User Sees: "This email is already registered. Please sign in or use a different email."
Result: Stays on SignupModal, can try different email or switch to login
```

### Example 3: Unverified Email
```
User: Successfully registered but didn't verify email
Next Day: User tries to login
Firebase Check: emailVerified = false
System: Signs user out immediately
User Sees: "Please verify your email address before logging in. Check your inbox for a verification link."
Result: Stays on LoginModal, must verify email first
```

### Example 4: Weak Password
```
User: Tries to sign up with password "123"
Firebase Validation: Rejects (< 6 characters)
User Sees: "Password is too weak. Please use at least 6 characters..."
Result: Stays on SignupModal, must use stronger password
```

## Firebase Configuration

### Required Firebase Settings

1. **Authentication Method:**
   - Email/Password enabled in Firebase Console
   - Under Authentication → Sign-in method

2. **Verification Email:**
   - Automatic (sent by Firebase)
   - Customizable in Firebase Console
   - Default: "Please verify your email address"

3. **API Configuration:**
   ```typescript
   // In src/app/app.config.ts
   provideAuth(() => getAuth()),
   ```

## Security Features

1. **Email Verification:**
   - Required before user can access app
   - Prevents fake/invalid email registrations
   - Blocks unverified users from logging in

2. **Password Requirements:**
   - Minimum 6 characters
   - Firebase enforces on backend
   - Frontend validates in real-time

3. **Error Messages:**
   - Generic messages for security
   - No revealing if email exists in system (except explicit signup error)
   - Rate limiting: Firebase blocks after too many failed attempts

4. **Session Management:**
   - Firebase handles secure tokens
   - Automatic token refresh
   - Logout clears all sessions

## Integration Points

### In App Component (`src/app/app.ts`)

```typescript
// Subscribe to Firebase user changes
ngOnInit(): void {
  this.authService.user$.subscribe(user => {
    if (user) {
      this.authService.currentUserSig.set({
        email: user.email!,
        username: user.displayName!
      })
    } else {
      this.authService.currentUserSig.set(null);
    }
  });
}

// Open modals from navbar
openLoginModal(): void {
  this.modalService.openModal('login');
}

openSignupModal(): void {
  this.modalService.openModal('signup');
}

// Logout
logout(): void {
  this.authService.logout();
}
```

### In App Template (`src/app/app.html`)

```html
<!-- Navbar conditionally shows auth/non-auth content -->
@if (authService.currentUserSig() == null) {
  <button class="btn btn-nav-login" (click)="openLoginModal()">Login</button>
  <button class="btn btn-nav-signup" (click)="openSignupModal()">Sign Up</button>
}

@if (authService.currentUserSig()) {
  <a class="nav-link" routerLink="/profile">
    <span class="profile-circle">👤</span>
  </a>
  <button class="btn btn-nav-logout" (click)="logout()">Logout</button>
}

<!-- Modals always present but hidden -->
<app-login-modal></app-login-modal>
<app-signup-modal></app-signup-modal>
```

## Testing Checklist

### Sign-Up Flow
- [ ] Open signup modal from navbar
- [ ] Enter valid username, email, password
- [ ] Verify password matching validation
- [ ] Submit form
- [ ] See success message
- [ ] Auto-redirect to login modal
- [ ] Check email for verification link
- [ ] Click verification link in email
- [ ] Return to login modal

### Login Flow (Before Verification)
- [ ] Try to login with unverified email
- [ ] See message: "Please verify your email address..."
- [ ] Stay on login modal
- [ ] Cannot proceed

### Login Flow (After Verification)
- [ ] Verify email via link
- [ ] Login with correct credentials
- [ ] Modal closes
- [ ] Redirect to home
- [ ] Navbar shows authenticated content

### Error Cases
- [ ] **Invalid Email:** See appropriate error
- [ ] **Email Already Used:** See specific error during signup
- [ ] **Wrong Password:** See "Incorrect password" error
- [ ] **Weak Password:** See "Password too weak" during signup
- [ ] **Network Error:** See connection error message
- [ ] **Too Many Attempts:** See rate limit message

### Modal Behavior
- [ ] Login/Signup buttons open correct modals
- [ ] Clicking backdrop closes modal
- [ ] Clicking X button closes modal
- [ ] ESC key closes modal
- [ ] Form resets on close
- [ ] Error messages clear on close
- [ ] Can switch between Login ↔ Signup

## Common Issues & Solutions

### Issue: User can't log in after signing up
**Solution:** Verify email first - click link in confirmation email

### Issue: Email verification email not received
**Solution:** 
1. Check spam/junk folder
2. Wait a few moments
3. Resend verification email (future feature)
4. Check email address for typos

### Issue: Password reset needed
**Solution:** 
- Current app doesn't have password reset
- Future enhancement needed
- Recommend using Firebase "Forgot Password" flow

### Issue: Account locked after too many attempts
**Solution:** Wait a few minutes and try again

## Future Enhancements

1. **Password Reset Flow:**
   - "Forgot Password" link on login
   - Email-based password reset
   - New password confirmation

2. **Resend Verification Email:**
   - Button in login modal if unverified
   - One-click resend option

3. **Social Login:**
   - Google Sign-In
   - GitHub Sign-In
   - Facebook Sign-In

4. **Two-Factor Authentication:**
   - SMS verification
   - Authenticator app support

5. **Account Management:**
   - Change email
   - Change password
   - Delete account

## Support & Debugging

### Enable Debug Logging
```typescript
// In app.config.ts
import { connectAuthEmulator } from 'firebase/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth(() => {
      const auth = getAuth();
      if (location.hostname === 'localhost') {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      return auth;
    }),
    // ... other providers
  ]
};
```

### Check Firebase Console
1. Go to Firebase Console
2. Select your project
3. Navigate to Authentication
4. View all users and their verification status
5. Check Auth settings for enabled methods

### Common Firebase Error Codes
- `auth/invalid-email` - Email format invalid
- `auth/user-not-found` - No account with this email
- `auth/wrong-password` - Incorrect password
- `auth/email-already-in-use` - Email taken
- `auth/weak-password` - Password < 6 chars
- `auth/too-many-requests` - Too many failed attempts
- `auth/network-request-failed` - Connection issue

