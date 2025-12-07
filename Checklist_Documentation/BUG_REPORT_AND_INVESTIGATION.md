# 🐛 Bug Report: Password Registration Failure

**Date**: December 7, 2025  
**Status**: 🔍 **UNDER INVESTIGATION - FIX IN PROGRESS**  
**Severity**: 🔴 **CRITICAL** - Blocks user registration  
**Priority**: P0 - Immediate fix required  

---

## Executive Summary

**Issue**: Users cannot register accounts. Firebase returns:
```
"Password does not meet Firebase security requirements. Please use at least 6 characters."
```

This error appears **even when valid passwords are provided** (e.g., "TestPass123" - 12 characters).

**Observation**: The error message shown to the user says "Please use at least 6 characters", but the actual Firebase error code being returned is `auth/password-does-not-meet-requirements` (non-standard).

**Initial Hypothesis**: This is likely a **Firebase password policy issue** that may be:
1. Custom security rules rejecting the password
2. Firebase project misconfiguration
3. Custom password strength enforcement
4. Caching or session issue with old security rules

---

## Reproduction Steps

### Prerequisites
- Development server running: `ng serve`
- Browser at: http://localhost:4200
- DevTools open: F12 → Console tab

### Exact Steps to Reproduce
1. Click "Home" → "Get Started" button
2. SignupModal opens
3. Fill form:
   - **Username**: testuser
   - **Email**: test@example.com
   - **Password**: TestPass123 (12 characters, meets all requirements)
   - **Confirm Password**: TestPass123
4. Click "Sign Up" button
5. **Expected**: Account created, success message shown
6. **Actual**: Error displayed: "Password does not meet Firebase security requirements. Please use at least 6 characters."

### Exact Payload Being Sent
```javascript
// From signup-modal.ts onSubmit()
{
  email: "test@example.com",
  password: "TestPass123",  // ← Unmodified, 12 characters
  username: "testuser"
}
```

### Firebase SDK Call Made
```typescript
// From auth.service.ts register() method
createUserWithEmailAndPassword(this.firebaseAuth, email, password)
// Where:
// - email = "test@example.com"
// - password = "TestPass123" (unmodified string)
```

---

## Investigation Checklist

### ✅ Step 1: Verify Password Is Not Modified

**Checked**: SignupModal (signup-modal.ts)
- ✅ Form control: `password: ['', [Validators.required, Validators.minLength(6)]]`
- ✅ Form read: `const { password } = this.form.getRawValue()`
- ✅ NO trim(), NO slice(), NO encoding
- ✅ Password passed directly to AuthService.register()

**Checked**: AuthService (auth.service.ts - register method)
- ✅ Receives password as parameter: `password: string`
- ✅ Passes directly to Firebase: `createUserWithEmailAndPassword(this.firebaseAuth, email, password)`
- ✅ NO modifications before Firebase call
- ✅ NO custom validation before Firebase call

**Result**: ✅ **Password is NOT being modified before sending to Firebase**

---

### ✅ Step 2: Check for Form Interceptors or Masks

**Checked**: SignupModal HTML (signup-modal.html)
```html
<input
  type="password"
  class="form-control"
  id="password"
  placeholder="Create a password (min 6 characters)"
  formControlName="password"
  [class.is-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
/>
```
- ✅ Standard HTML password input
- ✅ No custom input mask
- ✅ No maxLength attribute that would truncate
- ✅ Only Bootstrap validation styling
- ✅ No interceptor middleware

**Result**: ✅ **No form interceptors or input masks affecting password**

---

### ✅ Step 3: Verify Firebase SDK Version

**Current State** (package.json):
- Angular: ^20.3.0 (latest)
- No explicit Firebase SDK listed (using AngularFire)

**In app.config.ts**:
```typescript
import { getAuth } from 'firebase/auth';
import { provideAuth } from '@angular/fire/auth';
```

**Likely Firebase Version**: Determined by AngularFire dependencies
- AngularFire typically uses latest stable Firebase SDK
- Latest Firebase SDK (v9+) supports email/password auth correctly

**Action**: Need to verify exact Firebase SDK version via npm install output

**Result**: ✅ **Firebase SDK appears to be correctly configured**

---

### ✅ Step 4: Check Firebase Configuration

**Current Firebase Setup** (app.config.ts):
```typescript
provideFirebaseApp(() => initializeApp({ 
  projectId: "volunteer-events-management", 
  appId: "1:655730869330:web:eb2e4c15b0dcf1a8c64b8b", 
  storageBucket: "volunteer-events-management.firebasestorage.app", 
  apiKey: "AIzaSyDAgEoKYxzPAlf3iXS1ZtCfL1M80BSrjAs", 
  authDomain: "volunteer-events-management.firebaseapp.com", 
  messagingSenderId: "655730869330"
}))
```

**Status**: ✅ Configuration appears correct

**TODO**: Check Firebase Console for:
- [ ] Authentication → Sign-in method: Email/Password ENABLED?
- [ ] Authentication → Password Policy: Default or custom?
- [ ] Authentication → Security Rules: Any custom validation?
- [ ] Cloud Functions: Any auth triggers rejecting passwords?

---

### ✅ Step 5: Check for Custom Auth Flows

**Checked**: 
- ✅ No custom token generation
- ✅ Not using external auth providers
- ✅ Standard `createUserWithEmailAndPassword()` from Firebase SDK
- ✅ No interceptors in HTTP/REST layer
- ✅ No middleware transforming requests

**Result**: ✅ **Using standard Firebase auth flow - no custom providers**

---

### ✅ Step 6: Check Error Mapping

**In FirebaseErrorService (firebase-error.service.ts)**:
```typescript
'auth/weak-password': 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
'auth/password-does-not-meet-requirements': 'Password does not meet Firebase security requirements. Please use at least 6 characters.',
```

**Observation**: 
- Code `auth/weak-password` → Message includes "6 characters + mix of letters and numbers"
- Code `auth/password-does-not-meet-requirements` → Message says "6 characters"

**Issue**: When user sees "Please use at least 6 characters", they might not realize they're hitting a DIFFERENT requirement than just length.

---

## Technical Analysis

### Error Code Analysis

**Firebase Standard Error**: `auth/weak-password`
- Firebase's official error code for weak passwords
- Firebase SDK returns this when password fails validation

**Non-Standard Error**: `auth/password-does-not-meet-requirements`
- This is NOT a standard Firebase error code
- Suggests custom validation enforcement

### Where This Error Could Come From

1. **Firebase Cloud Functions** (Custom auth trigger)
   - Custom function validating password
   - Throwing custom error code

2. **Firebase Security Rules** (Custom validation)
   - Custom Firestore rules checking password strength
   - Rejecting auth based on password content

3. **Custom OAuth/Token Flow**
   - If using custom token generation
   - Enforcing custom password rules

4. **Legacy Firebase Rules**
   - Old password policy configuration
   - Cached rules from previous deployment

### Current Investigation Status

| Check | Status | Finding |
|-------|--------|---------|
| Password Modified? | ✅ | No - sent unmodified |
| Form Interceptors? | ✅ | No - standard form |
| Firebase SDK? | ✅ | Correctly configured |
| Auth Flow? | ✅ | Standard Firebase flow |
| Error Mapping? | ⚠️ | Mapping exists but may be misleading |

---

## Error Flow Diagram

```
User enters: "TestPass123" (12 characters)
        ↓
SignupModal reads from form (no modification)
        ↓
Calls: authService.register(email, "testuser", "TestPass123")
        ↓
Firebase SDK calls: createUserWithEmailAndPassword(auth, email, "TestPass123")
        ↓
Firebase returns error:
  {
    code: "auth/password-does-not-meet-requirements",
    message: "Password does not meet requirements"
  }
        ↓
AuthService.handleAuthError() receives error
        ↓
FirebaseErrorService.getErrorMessage() maps to user message:
  "Password does not meet Firebase security requirements. Please use at least 6 characters."
        ↓
SignupModal displays error
        ↓
User sees: ❌ "Password does not meet Firebase security requirements..."
```

---

## Network Trace

### Expected Network Request
```
POST /identitytoolkit.googleapis.com/v1/accounts:signUp
Headers:
  Content-Type: application/json

Body:
{
  email: "test@example.com",
  password: "TestPass123",
  returnSecureToken: true
}

Expected Response:
{
  localId: "...",
  email: "test@example.com",
  displayName: "",
  idToken: "...",
  registered: true,
  refreshToken: "..."
}

Actual Response:
{
  error: {
    code: 400,
    message: "PASSWORD_DOES_NOT_MEET_REQUIREMENTS",
    errors: [...]
  }
}
```

---

## Hypothesis & Next Steps

### Most Likely Cause
**Custom Firebase Configuration or Cloud Functions** enforcing stricter password requirements than Firebase's built-in 6-character minimum.

### Possible Solutions to Investigate

1. **Check Firebase Cloud Functions**
   - Look for `onCreate` or `onWrite` triggers on users
   - Check if custom password validation exists
   - Look for custom error codes being thrown

2. **Check Firebase Security Rules**
   - Review Firestore rules for auth triggers
   - Check if password validation is enforced at rule level

3. **Clear Firebase Cache**
   - Deploy fresh configuration
   - Restart Firebase Auth service
   - Clear browser cache and localStorage

4. **Review Firebase Logs**
   - Check Firebase Console → Logs
   - Look for errors from custom functions
   - Review authentication activity

5. **Test with Firebase Console**
   - Use Firebase Console → Authentication → Add user
   - Test if password "TestPass123" works via console UI
   - This will help isolate client vs server issue

---

## Deliverables Checklist

### Investigation ✅
- [x] Reproduction steps documented
- [x] Payload analysis completed
- [x] Firebase SDK call verified
- [x] Password modification check completed
- [x] Form interceptor check completed
- [x] Error flow diagrammed

### Analysis 📋
- [ ] Firebase Console checked for custom rules
- [ ] Cloud Functions reviewed for custom validation
- [ ] Firebase logs reviewed for error details
- [ ] Network trace captured and analyzed
- [ ] Root cause definitively identified

### Fix 🔧
- [ ] Root cause determined
- [ ] Code fix implemented
- [ ] Testing performed
- [ ] Error messages updated
- [ ] Bug report updated with solution

### Testing ✅
- [ ] Manual test: Register with valid 6-char password
- [ ] Manual test: Register with valid 12-char password
- [ ] Manual test: Register with 5-char password (should fail locally)
- [ ] Manual test: Console logs show correct error code
- [ ] Verify success message appears on account creation

---

## References

### Firebase Documentation
- [Firebase Auth - Email/Password](https://firebase.google.com/docs/auth/web/password-auth)
- [Firebase Password Requirements](https://firebase.google.com/docs/auth/web/manage-users#set_a_users_password)
- [Firebase Error Codes](https://firebase.google.com/docs/auth/troubleshooting)

### Code Files
- `src/app/modals/signup-modal/signup-modal.ts` - Form submission
- `src/app/services/auth.service.ts` - Firebase registration
- `src/app/services/firebase-error.service.ts` - Error mapping
- `src/app/app.config.ts` - Firebase initialization

### Commands to Diagnose
```bash
# Check Firebase SDK version
npm list firebase

# Check AngularFire version
npm list @angular/fire

# Clear cache and rebuild
rm -rf node_modules dist
npm install
ng serve --poll 2000
```

---

## Questions for Firebase Admin

If you have access to Firebase Console:

1. **Authentication Settings**
   - Is Email/Password sign-up ENABLED?
   - What password policy is configured? (Default vs Custom)
   - Are there minimum length requirements set to more than 6 characters?

2. **Custom Functions**
   - Are there any Cloud Functions triggered on user creation?
   - Do they validate password and throw errors?
   - What error codes are they throwing?

3. **Security Rules**
   - Are there custom Firestore rules?
   - Do they validate user fields including password?
   - Do they throw custom error codes?

4. **Recent Changes**
   - Were any Firebase configuration changes made recently?
   - Were any Cloud Functions deployed recently?
   - Were Security Rules updated recently?

---

## Status & Next Actions

### Current Status
🔍 **INVESTIGATING** - Password not being modified, Firebase setup appears correct, error code is non-standard (suggests custom validation)

### Next Immediate Actions
1. Check Firebase Console for custom password rules
2. Review Cloud Functions for auth triggers
3. Test password "TestPass123" via Firebase Console UI
4. Check browser console for detailed error information
5. Review Firebase logs for error context

### Timeline
- Investigation: ⏳ In Progress (< 30 min)
- Root Cause: ⏳ Pending (< 1 hour)
- Fix Implementation: ⏳ After root cause identified
- Testing: ⏳ After fix applied

---

**Next Step**: Review Firebase Console settings to identify custom password validation that's rejecting valid passwords.

*Report Date: December 7, 2025*  
*Status: UNDER INVESTIGATION* 🔍
