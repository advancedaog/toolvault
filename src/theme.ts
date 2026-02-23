// ─── Design Tokens ───

export const colors = {
    // Backgrounds
    bg: '#0a0a1a',
    bgCard: '#12122a',
    bgElevated: '#1a1a3a',
    bgInput: '#1e1e40',

    // Primary accent (electric blue → indigo gradient)
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',

    // Secondary accent (cyan)
    secondary: '#06b6d4',
    secondaryLight: '#22d3ee',

    // Success / Warning / Error
    success: '#22c55e',
    successLight: '#4ade80',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    error: '#ef4444',
    errorLight: '#f87171',

    // Text
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    // Borders
    border: '#2a2a4a',
    borderLight: '#3a3a5a',

    // Overlay
    overlay: 'rgba(0,0,0,0.6)',

    // White
    white: '#ffffff',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const typography = {
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodyBold: { fontSize: 16, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '400' as const },
    small: { fontSize: 11, fontWeight: '500' as const },
};

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    button: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
};
