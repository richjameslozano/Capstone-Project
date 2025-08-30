# Session Timeout Feature Test Guide

## Overview
The session timeout feature has been updated to handle page refreshes and ensure users are automatically logged out when their session expires, even if they don't click the "OK" button.

## Key Features

### 1. Persistent Session Tracking
- Session timeout is stored in `localStorage` as `sessionTimeout`
- Timestamp persists across page refreshes
- Automatically checks for expired sessions on page load

### 2. Automatic Logout Scenarios
- **Page Refresh**: If session expired while page was closed/refreshed, user is automatically logged out
- **Modal Timeout**: If user doesn't respond to timeout modal within 30 seconds, automatic logout occurs
- **Tab Switch**: If user switches tabs and returns after session expires, automatic logout occurs

### 3. User Activity Detection
- Resets timeout on: mouse movement, keyboard input, clicks, scrolling, touch events
- Handles page visibility changes (tab switching, minimizing)

## Testing the Feature

### Test 1: Basic Session Timeout
1. Log into the application
2. Wait for 10 minutes without any activity
3. Modal should appear with 30-second countdown
4. Don't click any button
5. After 30 seconds, you should be automatically logged out

### Test 2: Page Refresh During Session
1. Log into the application
2. Wait for 5 minutes (session still active)
3. Refresh the page
4. Session should continue normally

### Test 3: Page Refresh After Session Expires
1. Log into the application
2. Wait for 10+ minutes (session expires)
3. Refresh the page
4. You should be automatically logged out and redirected to login page

### Test 4: Tab Switching
1. Log into the application
2. Wait for 5 minutes
3. Switch to another tab
4. Wait for 5+ more minutes (total 10+ minutes)
5. Switch back to the application tab
6. You should be automatically logged out

### Test 5: Stay Logged In Option
1. Log into the application
2. Wait for 10 minutes until modal appears
3. Click "Stay Logged In"
4. Session should reset and continue normally

## Configuration

### Timeout Durations
- **Session Timeout**: 10 minutes (600,000 ms)
- **Modal Auto-Close**: 30 seconds (30,000 ms)

### To Change Timeout Duration
Edit the `timeoutDuration` variable in `SessionTimeout.js`:
```javascript
const timeoutDuration = 10 * 60 * 1000; // 10 minutes
```

## Files Modified
1. `SessionTimeout.js` - Main session timeout logic
2. `AppControllers.js` - Removed conflicting TimeoutProvider
3. `ProtectedRoute.js` - Added session timeout check

## Troubleshooting
- If session timeout doesn't work, check browser console for errors
- Ensure localStorage is enabled in the browser
- Verify that the user has proper permissions to access localStorage
