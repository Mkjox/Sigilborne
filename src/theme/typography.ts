// Typography system
export const typography = {
    // Font families
    fonts: {
        heading: 'Cinzel-Bold', // Mystical Serif Header
        body: 'Outfit-Regular', // Sleek UI Body text
        bodyBold: 'Outfit-Bold', // Bold UI highlight
        bodySemiBold: 'Outfit-SemiBold', // Semibold UI text
        mono: 'monospace',
    },

    // Font sizes
    sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Line heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Font weights
    weights: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
};

// Text style presets
export const textStyles = {
    h1: {
        fontFamily: typography.fonts.heading,
        fontSize: typography.sizes['5xl'],
        lineHeight: typography.sizes['5xl'] * typography.lineHeights.tight,
        fontWeight: 'normal' as const,
    },
    h2: {
        fontFamily: typography.fonts.heading,
        fontSize: typography.sizes['4xl'],
        lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
        fontWeight: 'normal' as const,
    },
    h3: {
        fontFamily: typography.fonts.heading,
        fontSize: typography.sizes['3xl'],
        lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
        fontWeight: 'normal' as const,
    },
    h4: {
        fontFamily: typography.fonts.bodySemiBold,
        fontSize: typography.sizes['2xl'],
        lineHeight: typography.sizes['2xl'] * typography.lineHeights.normal,
        fontWeight: 'normal' as const,
    },
    body: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.base,
        lineHeight: typography.sizes.base * typography.lineHeights.normal,
        fontWeight: typography.weights.normal,
    },
    bodyLarge: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.lg,
        lineHeight: typography.sizes.lg * typography.lineHeights.normal,
        fontWeight: typography.weights.normal,
    },
    bodySmall: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        lineHeight: typography.sizes.sm * typography.lineHeights.normal,
        fontWeight: typography.weights.normal,
    },
    caption: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.xs,
        lineHeight: typography.sizes.xs * typography.lineHeights.normal,
        fontWeight: typography.weights.normal,
    },
    button: {
        fontFamily: typography.fonts.bodySemiBold,
        fontSize: typography.sizes.base,
        lineHeight: typography.sizes.base * typography.lineHeights.tight,
        fontWeight: 'normal' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
};
