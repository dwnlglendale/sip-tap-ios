-- Enable Row Level Security
-- Note: JWT secret is automatically managed by Supabase

-- Create custom types
CREATE TYPE activity_level AS ENUM ('sedentary', 'active', 'athlete');
CREATE TYPE reminder_mode AS ENUM ('smart', 'manual');
CREATE TYPE eco_choice AS ENUM ('bottles', 'trees', 'skip');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0,
    activity_level activity_level DEFAULT 'sedentary',
    daily_goal INTEGER DEFAULT 2500,
    reminder_mode reminder_mode DEFAULT 'smart',
    manual_reminders TEXT[] DEFAULT '{}',
    eco_choice eco_choice DEFAULT 'skip',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_progress table
CREATE TABLE daily_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    current_intake INTEGER DEFAULT 0,
    goal_reached BOOLEAN DEFAULT FALSE,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create water_logs table
CREATE TABLE water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_daily_progress_user_id_date ON daily_progress(user_id, date);
CREATE INDEX idx_water_logs_user_id_logged_at ON water_logs(user_id, logged_at);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for daily_progress
CREATE POLICY "Users can view own daily progress" ON daily_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily progress" ON daily_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily progress" ON daily_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for water_logs
CREATE POLICY "Users can view own water logs" ON water_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON water_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for achievements
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at 
    BEFORE UPDATE ON daily_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to calculate daily progress
CREATE OR REPLACE FUNCTION calculate_daily_progress(user_uuid UUID, target_date DATE)
RETURNS TABLE (
    total_intake INTEGER,
    goal_reached BOOLEAN,
    daily_goal INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(wl.amount), 0) as total_intake,
        COALESCE(SUM(wl.amount), 0) >= up.daily_goal as goal_reached,
        up.daily_goal
    FROM user_profiles up
    LEFT JOIN water_logs wl ON wl.user_id = up.user_id 
        AND DATE(wl.logged_at) = target_date
    WHERE up.user_id = user_uuid
    GROUP BY up.daily_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get weekly stats
CREATE OR REPLACE FUNCTION get_weekly_stats(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    date DATE,
    total_intake INTEGER,
    goal_reached BOOLEAN,
    daily_goal INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date,
        COALESCE(SUM(wl.amount), 0) as total_intake,
        COALESCE(SUM(wl.amount), 0) >= up.daily_goal as goal_reached,
        up.daily_goal
    FROM generate_series(start_date, end_date, '1 day'::interval) d(date)
    CROSS JOIN user_profiles up
    LEFT JOIN water_logs wl ON wl.user_id = up.user_id 
        AND DATE(wl.logged_at) = d.date
    WHERE up.user_id = user_uuid
    GROUP BY d.date, up.daily_goal
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 