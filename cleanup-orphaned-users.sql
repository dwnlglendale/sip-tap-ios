-- Cleanup script for orphaned users
-- Run this in your Supabase SQL editor to fix JWT token mismatches

-- First, let's see what users exist in auth.users but not in user_profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;

-- Delete orphaned auth users (users without profiles)
-- WARNING: This will permanently delete users from auth.users
-- Only run this if you're sure you want to delete these users
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.id IS NULL
);

-- Alternative: Create profiles for orphaned users instead of deleting them
-- This is safer and preserves the auth users
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

-- Check for any remaining orphaned users
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;

-- Verify all users now have profiles
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(up.id) as users_with_profiles,
  COUNT(*) - COUNT(up.id) as orphaned_users
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id; 