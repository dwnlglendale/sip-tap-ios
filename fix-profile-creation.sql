-- First, let's check if the trigger exists and is working
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_value TEXT;
BEGIN
    -- Get username from metadata or generate one
    username_value := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'User' || substr(NEW.id::text, 1, 8)
    );
    
    -- Insert user profile with explicit error handling
    BEGIN
        INSERT INTO user_profiles (user_id, username, weight, activity_level, daily_goal, reminder_mode, eco_choice)
        VALUES (
            NEW.id,
            username_value,
            0,
            'sedentary',
            2500,
            'smart',
            'skip'
        );
        
        RAISE NOTICE 'User profile created successfully for user %', NEW.id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'User profile already exists for user %', NEW.id;
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Also ensure the user_profiles table has the right permissions
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON user_profiles TO authenticated;

-- Check if there are any existing users without profiles
SELECT 
    au.id,
    au.email,
    up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL; 