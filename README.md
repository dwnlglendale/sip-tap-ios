# SipTap - Your Personal Hydration Companion

A modern, user-friendly hydration tracking app built with Expo and React Native.

## Features

### Onboarding Flow
- **Welcome Screen**
  - Beautiful animated welcome screen
  - "Get Started" button to begin personalization
  - Smooth transitions and animations

### Personalization Flow
1. **Username Setup**
   - Collect user's name for personalized experience
   - Input validation and error handling
   - Dark mode support

2. **Hydration Goal Setup**
   - Weight input for personalized calculations
   - Activity level selection (Sedentary, Active, Athlete)
   - Dynamic daily water goal calculation
   - Real-time goal updates

3. **Preferences**
   - Reminder settings
   - Notification preferences
   - Customizable tracking options

4. **Gamification**
   - Streak tracking system
   - Achievement system
   - Progress visualization

5. **Eco-Friendly Options**
   - Bottle saving tracking
   - Environmental impact visualization
   - Sustainability tips

6. **Dashboard Introduction**
   - Feature overview
   - Quick start guide
   - Animated transitions

### Main App Features
- **Home Screen**
  - Personalized greeting with user's name
  - Daily progress tracking
  - Quick-add water intake buttons
  - Streak counter
  - Environmental impact stats
  - Weather-based hydration reminders

- **Progress Tracking**
  - Daily water intake monitoring
  - Goal progress visualization
  - Streak system
  - Achievement tracking

- **Quick Actions**
  - One-tap water logging
  - Custom amount input
  - Quick-add presets (250ml, 500ml, 750ml)

## Technical Implementation

### Navigation Structure
```
app/
├── (app)/
│   ├── home.tsx
│   └── _layout.tsx
├── (personalization)/
│   ├── username.tsx
│   ├── hydration-goal.tsx
│   ├── preferences.tsx
│   ├── gamification.tsx
│   ├── eco-friendly.tsx
│   ├── dashboard-intro.tsx
│   └── _layout.tsx
├── onboarding.tsx
└── _layout.tsx
```

### State Management
- PersonalizationContext for managing user preferences
- AsyncStorage for persisting user data
- Local state management for UI components

### Testing Features
- Easy onboarding reset for testing
- Toggle `FORCE_ONBOARDING` in `_layout.tsx`:
  ```typescript
  const FORCE_ONBOARDING = true; // Set to true to force onboarding
  ```

## Development Notes

### Navigation Flow
1. Onboarding → Username → Hydration Goal → Preferences → Gamification → Eco-Friendly → Dashboard Intro → Main App

### Data Persistence
- User preferences stored in AsyncStorage
- Daily progress tracking
- Streak and achievement data

### UI/UX Features
- Dark mode support
- Responsive design
- Smooth animations
- Intuitive navigation
- Progress visualization

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npx expo start
   ```

## Testing

To test the onboarding flow:
1. Set `FORCE_ONBOARDING = true` in `app/_layout.tsx`
2. Restart the app
3. Complete the onboarding process
4. Set `FORCE_ONBOARDING = false` to test with saved preferences

## Next Steps
- Implement custom water intake input
- Add detailed statistics and analytics
- Enhance gamification features
- Add social features
- Implement push notifications
- Add offline support
