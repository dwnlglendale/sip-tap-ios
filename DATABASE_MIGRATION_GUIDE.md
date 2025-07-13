# Database Migration Guide

## Overview

This guide outlines the migration from AsyncStorage to Supabase database for better data persistence, synchronization, and scalability.

## Current AsyncStorage Data Analysis

### ✅ **MOVE TO DATABASE**

#### 1. Daily Progress Data
- **Current Location**: `dailyProgress`, `dailyProgress_${date}`
- **Database Table**: `daily_progress`
- **Reason**: Core app data that should persist across devices and sync
- **Migration**: ✅ Implemented

#### 2. Achievements Data
- **Current Location**: `achievements`
- **Database Table**: `achievements`
- **Reason**: User progress data that should be permanent
- **Migration**: ✅ Implemented

#### 3. User Preferences
- **Current Location**: `userPreferences`
- **Database Table**: `user_profiles`
- **Reason**: User settings that should sync across devices
- **Migration**: ✅ Implemented

### ⚠️ **KEEP IN ASYNCSTORAGE**

#### 1. Onboarding Status
- **Current Location**: `hasCompletedOnboarding`
- **Reason**: Device-specific UI state, doesn't need to sync
- **Action**: Keep in AsyncStorage

## Database Schema

The Supabase schema already supports all the data we need:

```sql
-- Daily Progress
CREATE TABLE daily_progress (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    current_intake INTEGER DEFAULT 0,
    goal_reached BOOLEAN DEFAULT FALSE,
    streak_days INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER NOT NULL,
    UNIQUE(user_id, achievement_type)
);

-- User Profiles (already exists)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    username TEXT NOT NULL,
    weight DECIMAL(5,2) DEFAULT 0,
    activity_level activity_level DEFAULT 'sedentary',
    daily_goal INTEGER DEFAULT 2500,
    reminder_mode reminder_mode DEFAULT 'smart',
    manual_reminders TEXT[] DEFAULT '{}',
    eco_choice eco_choice DEFAULT 'skip'
);
```

## Migration Implementation

### 1. Enhanced Supabase Service

Added new functions to `app/services/supabase.ts`:

```typescript
// Daily Progress
- getOrCreateDailyProgress(userId, date)
- getWeeklyProgress(userId, startDate, endDate)
- upsertDailyProgress(progress)

// Achievements
- initializeUserAchievements(userId)
- upsertAchievement(achievement)

// Water Logs (for calculating daily totals)
- logWater(userId, amount)
```

### 2. Data Migration Service

Created `app/services/dataMigration.ts` to handle:

- **Migration Detection**: Check if AsyncStorage data exists
- **Data Migration**: Move data from AsyncStorage to database
- **Cleanup**: Remove migrated data from AsyncStorage
- **Error Handling**: Graceful handling of migration failures

### 3. Automatic Migration

Updated `AuthContext` to automatically:

- Check for migration needs when user signs in
- Perform migration in background
- Handle errors gracefully
- Log migration status

## Benefits of Database Storage

### 1. **Data Persistence**
- Data survives app reinstalls
- No data loss when clearing app cache
- Permanent storage of user progress

### 2. **Cross-Device Sync**
- Users can access data on multiple devices
- Real-time synchronization
- Consistent experience across platforms

### 3. **Scalability**
- Can handle large amounts of historical data
- Efficient querying and aggregation
- Better performance for complex operations

### 4. **Analytics & Insights**
- Can analyze user patterns across the platform
- Generate insights and recommendations
- Support for advanced features

### 5. **Backup & Recovery**
- Automatic database backups
- Data recovery capabilities
- Disaster recovery protection

## Migration Process

### Automatic Migration (Recommended)

1. **User Signs In**: AuthContext detects migration needs
2. **Background Migration**: Data is moved to database
3. **Cleanup**: AsyncStorage data is removed
4. **Seamless Experience**: User continues using app normally

### Manual Migration (If Needed)

```typescript
import { dataMigrationService } from '../services/dataMigration';

// Check migration status
const status = await dataMigrationService.checkMigrationNeeded();

// Perform migration
const result = await dataMigrationService.performMigration(userId);
```

## Updated App Flow

### 1. **Water Logging**
```typescript
// Old: AsyncStorage only
await AsyncStorage.setItem('dailyProgress', JSON.stringify(progress));

// New: Database + AsyncStorage for offline support
await supabaseService.logWater(userId, amount);
await supabaseService.upsertDailyProgress(progress);
```

### 2. **Progress Loading**
```typescript
// Old: AsyncStorage only
const progress = await AsyncStorage.getItem('dailyProgress');

// New: Database with fallback
const progress = await supabaseService.getOrCreateDailyProgress(userId, date);
```

### 3. **Stats & Charts**
```typescript
// Old: Mock data from AsyncStorage
const weeklyData = generateMockData();

// New: Real data from database
const weeklyData = await supabaseService.getWeeklyProgress(userId, startDate, endDate);
```

## Error Handling

### Migration Errors
- Log errors for debugging
- Continue app functionality
- Retry migration on next sign-in
- Fallback to AsyncStorage if needed

### Network Issues
- Cache data locally for offline use
- Sync when connection restored
- Graceful degradation

## Testing

### Migration Testing
1. Create test data in AsyncStorage
2. Sign in with test user
3. Verify migration completes successfully
4. Confirm data appears in database
5. Verify AsyncStorage is cleaned up

### Functionality Testing
1. Test water logging with database
2. Verify progress tracking works
3. Test achievements system
4. Verify stats and charts load correctly

## Rollback Plan

If issues arise:

1. **Immediate**: Disable automatic migration
2. **Fallback**: Use AsyncStorage temporarily
3. **Fix**: Address database issues
4. **Re-enable**: Turn migration back on

## Performance Considerations

### Database Queries
- Use indexes for fast queries
- Implement caching for frequently accessed data
- Optimize queries for mobile performance

### Offline Support
- Cache recent data locally
- Queue operations for when online
- Sync when connection restored

## Security

### Row Level Security (RLS)
- Users can only access their own data
- Automatic data isolation
- Secure by default

### Data Validation
- Validate data before database insertion
- Sanitize user inputs
- Prevent SQL injection

## Next Steps

1. **Deploy Migration**: Test in development environment
2. **Monitor**: Watch for migration errors
3. **Optimize**: Improve performance based on usage
4. **Enhance**: Add more database features

## Conclusion

Moving from AsyncStorage to Supabase database provides:

- ✅ Better data persistence
- ✅ Cross-device synchronization
- ✅ Improved scalability
- ✅ Enhanced security
- ✅ Better user experience

The migration is designed to be seamless and automatic, ensuring users don't lose any data during the transition. 