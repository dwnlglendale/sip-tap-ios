-- Create profiles for any existing users who don't have them
INSERT INTO user_profiles (user_id, username, weight, activity_level, daily_goal, reminder_mode, eco_choice)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'User' || substr(au.id::text, 1, 8)),
    0,
    'sedentary',
    2500,
    'smart',
    'skip'
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify the profiles were created
SELECT 
    au.email,
    up.username,
    up.created_at
FROM auth.users au
JOIN user_profiles up ON au.id = up.user_id
ORDER BY up.created_at DESC; 