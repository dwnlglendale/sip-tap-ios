# Authentication Troubleshooting Guide

## Current Issue: "User from sub claim in JWT does not exist"

This error occurs when the JWT token contains a user ID that doesn't exist in your Supabase database. This typically happens when:

1. A user was created in Supabase Auth but the profile creation failed
2. A user was deleted from the database but the JWT token is still valid
3. There's a mismatch between auth users and database users

## Solutions

### 1. Clear the App Session (Immediate Fix)

The updated AuthContext now includes a `clearSession` function that will automatically handle this error. You can:

**Option A: Use the Debug Component**
- Look for the debug info overlay in the top-right corner of your app
- Tap the "Clear Session" button
- This will force you to sign in again

**Option B: Restart the App**
- Close the app completely
- Clear the app cache (if possible)
- Restart the app
- The new error handling should automatically clear invalid sessions

### 2. Fix the Database (Permanent Fix)

Run the cleanup script in your Supabase SQL editor:

```sql
-- First, check for orphaned users
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;
```

**If you find orphaned users, choose one of these options:**

**Option A: Create profiles for orphaned users (Recommended)**
```sql
INSERT INTO user_profiles (user_id, username, weight, activity_level, daily_goal, reminder_mode, eco_choice)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', 'User'),
  0,
  'sedentary',
  2500,
  'smart',
  'skip'
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;
```

**Option B: Delete orphaned auth users (Use with caution)**
```sql
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.id IS NULL
);
```

### 3. Verify the Fix

After running the cleanup, verify all users have profiles:

```sql
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(up.id) as users_with_profiles,
  COUNT(*) - COUNT(up.id) as orphaned_users
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id;
```

This should show 0 orphaned users.

## Prevention

The updated AuthContext now includes:

1. **Automatic session refresh** before checking user status
2. **JWT error detection** with automatic session clearing
3. **Profile creation fallback** if the database trigger fails
4. **Better error handling** for all authentication edge cases
5. **Timeout protection** to prevent infinite loading

## Debug Information

The app now shows detailed debug information in development mode:

- Current loading state
- User authentication status
- Profile loading status
- Onboarding completion status
- Manual session clear button

## Common Scenarios

### Scenario 1: App stuck on loading screen
- Check the debug overlay for loading reasons
- Use the "Clear Session" button
- Restart the app if needed

### Scenario 2: Can't sign in after clearing session
- Verify your Supabase credentials in `app/services/supabase.ts`
- Check that email confirmation is properly configured
- Ensure the user exists in Supabase Auth

### Scenario 3: Profile not loading after sign in
- The app will automatically create a default profile
- Check the console logs for any database errors
- Verify RLS policies are correctly configured

## Next Steps

1. **Immediate**: Use the "Clear Session" button in the debug overlay
2. **Short-term**: Run the database cleanup script
3. **Long-term**: Monitor the console logs for any recurring issues

The updated authentication flow should handle most edge cases automatically, but if you continue to experience issues, check the console logs for specific error messages. 