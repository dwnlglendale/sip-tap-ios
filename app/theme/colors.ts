export const colors = {
  // Primary Colors
  primary: {
    main: '#00AEEF', // Aqua Blue
    dark: '#0077B6', // Deep Blue
    light: '#B3E5FC', // Light Aqua
  },
  
  // Secondary Colors
  secondary: {
    white: '#FFFFFF',
    lightBlue: '#E0F7FA',
    black: '#000000',
    // Dark mode specific
    darkBackground: '#121212', // Main dark background
    darkSurface: '#1E1E1E',   // Slightly lighter dark surface
    darkCard: '#2D2D2D',      // Dark card background
  },
  
  // Accent Colors
  accent: {
    green: '#2ECC71', // Soft Green
    purple: '#7B68EE', // Vibrant Purple
    blue: '#4A90E2',   // Bright Blue
    red: '#E74C3C',    // Error Red
  },
  
  // Neutral Colors
  neutral: {
    // Light mode
    darkGray: '#2C3E50',
    lightGray: '#BDC3C7',
    white: '#FFFFFF',
    black: '#000000',
    // Dark mode specific
    darkModeGray: '#9E9E9E',    // Dark mode text
    darkModeLightGray: '#757575', // Dark mode secondary text
    darkModeBorder: '#404040',   // Dark mode borders
    darkModeDivider: '#323232',  // Dark mode dividers
  },
  
  // Status Colors
  status: {
    success: '#2ECC71',
    warning: '#F1C40F',
    error: '#E74C3C',
    info: '#3498DB',
  },
  
  // Text Colors
  text: {
    primary: '#2C3E50',      // Light mode primary text
    secondary: '#7F8C8D',    // Light mode secondary text
    disabled: '#BDC3C7',     // Light mode disabled text
    // Dark mode
    darkPrimary: '#FFFFFF',  // Dark mode primary text
    darkSecondary: '#B3B3B3', // Dark mode secondary text
    darkDisabled: '#757575', // Dark mode disabled text
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',      // Light mode primary background
    secondary: '#F5F6FA',    // Light mode secondary background
    // Dark mode
    darkPrimary: '#121212',  // Dark mode primary background
    darkSecondary: '#1E1E1E', // Dark mode secondary background
  },
  
  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.05)',  // Light mode overlay
    dark: 'rgba(255, 255, 255, 0.05)', // Dark mode overlay
  },
} as const;

// Helper function to get theme-aware colors
export const getThemeColors = (isDarkMode: boolean) => ({
  // Backgrounds
  background: isDarkMode ? colors.background.darkPrimary : colors.background.primary,
  surface: isDarkMode ? colors.secondary.darkSurface : colors.secondary.white,
  card: isDarkMode ? colors.secondary.darkCard : colors.secondary.white,
  
  // Text
  text: isDarkMode ? colors.text.darkPrimary : colors.text.primary,
  textSecondary: isDarkMode ? colors.text.darkSecondary : colors.text.secondary,
  textDisabled: isDarkMode ? colors.text.darkDisabled : colors.text.disabled,
  
  // Borders
  border: isDarkMode ? colors.neutral.darkModeBorder : colors.neutral.lightGray,
  divider: isDarkMode ? colors.neutral.darkModeDivider : colors.neutral.lightGray,
  
  // Accents
  primary: colors.primary.main,
  accent: colors.accent.purple,
  
  // Status
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error,
  info: colors.status.info,
});

export default colors; 