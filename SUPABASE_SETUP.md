# Supabase Setup Guide for SipTap

This guide will help you set up Supabase for the SipTap hydration tracking app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `sip-tap` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env` file in your project root with the following content:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL editor and click "Run"

This will create all the necessary tables, indexes, and security policies.

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure your authentication settings:
   - **Site URL**: `http://localhost:8081` (for development)
   - **Redirect URLs**: Add your app's redirect URLs
3. Go to **Authentication** → **Providers**
4. Enable **Email** provider
5. Configure email templates if desired

## 6. Test the Setup

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. The app should now redirect to the login screen if no user is authenticated
3. Try creating a new account and signing in

## 7. Database Tables Overview

The schema creates the following tables:

### `user_profiles`
- Stores user preferences and settings
- Linked to Supabase auth users
- Contains hydration goals, activity levels, etc.

### `daily_progress`
- Tracks daily water intake progress
- Stores streak information
- One record per user per day

### `water_logs`
- Individual water intake entries
- Timestamped for detailed tracking
- Used for statistics and analytics

### `achievements`
- User achievements and progress
- Gamification system
- Tracks completion status

## 8. Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Automatic user profile creation on signup
- Secure authentication with JWT tokens

## 9. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 10. Troubleshooting

### Common Issues:

1. **"Invalid API key" error**
   - Check that your environment variables are correctly set
   - Restart your development server after changing `.env`

2. **"Table doesn't exist" error**
   - Make sure you've run the SQL schema in Supabase
   - Check that all tables were created successfully

3. **Authentication not working**
   - Verify your Supabase project URL and key
   - Check that email authentication is enabled
   - Ensure redirect URLs are configured correctly

4. **Data not syncing**
   - Check your internet connection
   - Verify that RLS policies are correctly set up
   - Check browser console for error messages

## 11. Production Deployment

For production deployment:

1. Update your Supabase project settings:
   - Add your production domain to Site URL
   - Update redirect URLs for production
   - Configure custom email templates

2. Set up environment variables in your hosting platform:
   - Vercel, Netlify, or your preferred hosting service
   - Use the same variable names as in `.env`

3. Test authentication flow in production environment

## 12. Additional Features

The Supabase setup includes:

- **Real-time subscriptions** for live data updates
- **Database functions** for complex queries
- **Automatic timestamps** for all records
- **Indexes** for optimal performance
- **Triggers** for automatic data management

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Expo documentation](https://docs.expo.dev)
3. Check the app's console logs for detailed error messages
4. Verify your Supabase project settings and permissions 