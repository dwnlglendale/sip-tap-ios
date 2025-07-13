-- Check for any orphaned auth.users that don't have profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN up.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- Check for any profiles without corresponding auth.users
SELECT 
    up.id,
    up.user_id,
    up.username,
    up.created_at,
    CASE WHEN au.id IS NULL THEN 'ORPHANED' ELSE 'VALID' END as user_status
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- Clean up any orphaned profiles (be careful with this!)
-- DELETE FROM user_profiles 
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Check recent auth activity
SELECT 
    id,
    user_id,
    event_type,
    created_at
FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10; 