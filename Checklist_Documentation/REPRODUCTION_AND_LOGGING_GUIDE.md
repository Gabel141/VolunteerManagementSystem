# 🔍 Reproduction Steps & Detailed Logging Guide

**Purpose**: Document exact steps to reproduce the password error and capture detailed logs for analysis.

---

## Quick Reproduction (2 minutes)

### Minimum Steps
```
1. ng serve (if not already running)
2. Visit http://localhost:4200
3. Click "Get Started" button
4. Fill form:
   - Username: testuser
   - Email: test@example.com  
   - Password: TestPass123
   - Confirm: TestPass123
5. Click "Sign Up"
6. Observe error: "Password does not meet Firebase security requirements..."
```

---

## Detailed Reproduction with Logging

### Setup (Prerequisites)
- [ ] Stop any running servers: `Ctrl+C`
- [ ] Fresh build:
  ```bash
  npm install
  npm cache clean --force
  rm -rf dist
  ng serve
  ```
- [ ] Browser: Chrome or Firefox (with DevTools)
- [ ] URL: http://localhost:4200

### Step-by-Step with Logging

#### Step 1: Open DevTools
1. Press `F12`
2. Go to **Console** tab
3. Go to **Network** tab
4. Filter by: Type = "XHR" or "Fetch"
5. Keep both tabs visible (or switch between them)

#### Step 2: Navigate to SignUp Modal
1. Page loads at http://localhost:4200
2. Click **"Get Started"** button on home page
3. **Verify**: SignupModal opens
4. **In Console**: Should see no errors yet
5. **Take Screenshot #1**: Modal is open with empty form

#### Step 3: Fill Form (Exact Values)
Fill in exactly these values:
- **Username**: `testuser`
- **Email**: `test@example.com`
- **Password**: `TestPass123` (exactly this, including capital T)
- **Confirm Password**: `TestPass123` (exactly this)

After filling, **Take Screenshot #2**: Form filled with values

#### Step 4: Prepare Network Capture
1. **In Network Tab**: Click **trash icon** to clear logs
2. **Ensure**: "Preserve log" is CHECKED ✅
3. **Ready**: Network tab is ready to capture request

#### Step 5: Submit Form
1. Click **"Sign Up"** button
2. Immediately look at **Network tab**
3. **Watch for**: Request to `identitytoolkit.googleapis.com`
4. **Wait**: For response to appear

#### Step 6: Capture Network Details
1. Find request to: `https://identitytoolkit.googleapis.com/v1/accounts:signUp`
2. Click on it to expand
3. Go to **"Request"** tab:
   - Copy the entire request body
   - Note the password value sent
4. Go to **"Response"** tab:
   - Copy the entire response
   - Note the error code returned

**Capture Network Request Body**:
```
POST /v1/accounts:signUp
Headers:
  [Capture headers]

Body:
[Paste request body here]
```

**Capture Network Response**:
```
Status: [Note HTTP status]
Response:
[Paste response body here]
```

#### Step 7: Check Console Logs
1. Go to **Console tab**
2. Look for messages starting with:
   - `Firebase Auth Error:`
   - `Error Code:`
   - `Error Message:`
3. **Expand** the error object
4. Note all properties:
   - code
   - message
   - customData
   - any other properties

**Copy Full Console Error**:
```
[Paste complete console error object here]
```

#### Step 8: Check Error Display
1. In UI, observe the error message shown
2. **Note exact text**: 
3. **Compare** with Firebase error from Console

**Error Message Shown to User**:
```
[Paste exact error message shown in modal]
```

#### Step 9: Check Form State
1. Did form reset? YES / NO
2. Can you edit the fields? YES / NO
3. Can you retry? YES / NO

---

## Expected vs Actual Comparison

### Expected Behavior
```
Input Values:
  email: "test@example.com"
  password: "TestPass123" (12 characters)
  username: "testuser"

Firebase Network Request:
  POST to identitytoolkit.googleapis.com/v1/accounts:signUp
  Body includes: password: "TestPass123"

Firebase Response:
  Status: 200 OK
  Response: 
  {
    localId: "...",
    email: "test@example.com",
    idToken: "...",
    registered: true
  }

Client Behavior:
  Modal shows: "Account created! Please check your email..."
  Modal closes after 2 seconds
  Page redirects to Home
```

### Actual Behavior (BROKEN)
```
Input Values:
  email: "test@example.com"
  password: "TestPass123" (12 characters)
  username: "testuser"

Firebase Network Request:
  POST to identitytoolkit.googleapis.com/v1/accounts:signUp
  Body includes: password: "TestPass123"

Firebase Response:
  Status: 400 Bad Request
  Response error:
  {
    error: {
      code: 400,
      message: "PASSWORD_DOES_NOT_MEET_REQUIREMENTS"
    }
  }

Client Behavior:
  Modal shows: "Password does not meet Firebase security requirements. Please use at least 6 characters."
  Modal stays open
  Form NOT reset
  Can retry
```

---

## Password Strength Variations to Test

Test these in order. **Stop** if one succeeds.

### Test 1: Minimum Valid (6 characters)
```
Username: test1
Email: test1@example.com
Password: 123456
Confirm: 123456
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 2: Typical Valid (8+ mixed)
```
Username: test2
Email: test2@example.com
Password: TestPass1
Confirm: TestPass1
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 3: All Uppercase (6 chars)
```
Username: test3
Email: test3@example.com
Password: ABCDEF
Confirm: ABCDEF
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 4: All Lowercase (6 chars)
```
Username: test4
Email: test4@example.com
Password: abcdef
Confirm: abcdef
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 5: Numbers Only (6+ chars)
```
Username: test5
Email: test5@example.com
Password: 123456789
Confirm: 123456789
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 6: With Special Chars
```
Username: test6
Email: test6@example.com
Password: Test@123!
Confirm: Test@123!
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

### Test 7: Very Long (50 chars)
```
Username: test7
Email: test7@example.com
Password: VeryLongPasswordWith50CharactersForTestingPurpo
Confirm: VeryLongPasswordWith50CharactersForTestingPurpo
Expected: SUCCESS ✓ or ERROR ✗
Result: [ ] PASS  [ ] FAIL
Error Code: _______________
```

---

## Console Logging Verification

### What to Look For in Console

**Success Case** (if password works):
```
No Firebase Auth Error logs should appear
OR
Logs should show success messages
```

**Error Case** (password rejected):
```
Firefox Auth Error: {
  code: "auth/password-does-not-meet-requirements",
  message: "Password does not meet requirements",
  // ... other properties
}

Error Code: auth/password-does-not-meet-requirements
Error Message: Password does not meet requirements
```

### Checking Browser Console Step-by-Step

1. **Clear console**: Click trash icon in Console tab
2. **Attempt registration** with password
3. **Look for logs** starting with:
   - ✅ "Firebase Auth Error:" - indicates error occurred
   - ✅ "Error Code:" - shows the code Firebase returned
   - ✅ "Error Message:" - shows Firebase's error message
4. **Expand error object** by clicking on it
5. **Note all properties**:
   - `code` - The error code
   - `message` - Firebase's error message
   - `customData` - Any additional data
   - Any other custom properties

### Comparison: What Error Code Should This Be?

| Scenario | Expected Code | Actual Code (BROKEN) |
|----------|---|---|
| Password < 6 chars (local) | N/A (blocked by form) | - |
| Password = 6 chars | success | auth/password-does-not-meet-requirements ❌ |
| Password = "TestPass123" | success | auth/password-does-not-meet-requirements ❌ |

---

## Detailed Request/Response Logging

### Network Request (Copy from DevTools)

**To Capture**:
1. Network Tab → find `accounts:signUp` request
2. Click on it
3. Go to **Request** tab
4. Click **"Copy" → "Copy as cURL"**
5. Paste below

**Request Headers**:
```
POST /v1/accounts:signUp HTTP/1.1
Host: identitytoolkit.googleapis.com
Content-Type: application/json
User-Agent: [Your browser]

[Paste request body here]
```

**Request Body** (What was sent to Firebase):
```json
{
  [Paste body JSON here]
}
```

### Network Response (Copy from DevTools)

**To Capture**:
1. Network Tab → find `accounts:signUp` request
2. Click on it
3. Go to **Response** tab
4. Copy all content

**Response Headers**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json
[Other headers...]
```

**Response Body** (What Firebase returned):
```json
{
  [Paste response JSON here]
}
```

---

## Password Verification Checklist

### Before Submission ✅
- [ ] Password length: Exactly **12 characters** (TestPass123)
- [ ] Password contains: **Uppercase** (T)
- [ ] Password contains: **Lowercase** (e, s, t, a, s, s)
- [ ] Password contains: **Numbers** (1, 2, 3)
- [ ] No special characters (clean input)
- [ ] No leading/trailing spaces
- [ ] Not copy-pasted from somewhere (type manually)

### During Submission 🔍
- [ ] Console is open
- [ ] Network tab shows request being sent
- [ ] Request body contains exact password
- [ ] Response shows error

### After Submission 📊
- [ ] Error message displayed to user
- [ ] Form did NOT reset (good for debugging)
- [ ] Can view form values
- [ ] Can attempt to retry

---

## Common Issues & Debugging

### Issue: Form Validates But Doesn't Submit
**Check**:
- [ ] Is there a JavaScript error in Console?
- [ ] Does password field show "Password must be at least 6 characters"?
- [ ] Is the "Sign Up" button disabled?

**If Yes**: Password field validation is blocking submission locally (NOT Firebase issue)

### Issue: Request Never Sent to Firebase
**Check**:
- [ ] Is Network tab showing the request?
- [ ] Are there any CORS errors in Console?
- [ ] Is there a network timeout?

**If Yes**: Network/connectivity issue (NOT Firebase password validation)

### Issue: 200 OK Response But Still Shows Error
**Check**:
- [ ] Is response body valid JSON?
- [ ] Does response have `localId` field?
- [ ] Are there any console errors?

**If Yes**: Client-side error handling issue (NOT Firebase rejection)

---

## Final Checklist Before Reporting

- [ ] Exact reproduction steps documented
- [ ] All 7 password tests executed (at least Test 1 & 2)
- [ ] Console logs captured (Error Code)
- [ ] Network request captured (what was sent)
- [ ] Network response captured (what was returned)
- [ ] Screenshots taken (form, error, logs)
- [ ] Comparison made (expected vs actual)
- [ ] Results compiled in structured format

---

## Information to Include in Bug Report

When reporting this issue, include:

1. **Your Environment**
   - Browser: Chrome / Firefox / Safari / Edge
   - OS: Windows / Mac / Linux
   - Node version: [from `node --version`]
   - Angular version: [from package.json]

2. **Steps to Reproduce**
   - Exactly as documented above

3. **Expected Result**
   - "Account created! Please check your email..."

4. **Actual Result**
   - Error message shown
   - Error code from console
   - Status code from network response

5. **Evidence**
   - Screenshots of form, error, console
   - Network request body (JSON)
   - Network response body (JSON)
   - Console error logs (full object)

6. **Password Tested**
   - Exact value: `TestPass123`
   - Length: 12 characters
   - Character types: Uppercase + Lowercase + Numbers

---

**This document should be completed BEFORE attempting any code fixes.**

Next: Use this guide to gather detailed error information, then proceed to ROOT_CAUSE_ANALYSIS.md

*Last Updated: December 7, 2025*
