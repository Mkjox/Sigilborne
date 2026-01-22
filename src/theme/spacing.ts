// Spacing system (4px base unit)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
};

// Border radius
export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
};

// Shadows
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    glow: {
        shadowColor: '#6600ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    glowGold: {
        shadowColor: '#ffb900',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 10,
    },
};

// Z-index layers
export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
};

// Card dimensions
export const cardDimensions = {
    width: 120,
    height: 168,
    aspectRatio: 120 / 168,
};

// Board dimensions
export const boardDimensions = {
    rowHeight: 180,
    cardSpacing: 8,
};

// Helper to calculate responsive card dimensions
export const getCardDimensions = (screenWidth: number, screenHeight: number) => {
    // Is landscape?
    const isLandscape = screenWidth > screenHeight;

    // In landscape, height is the constraint. 
    // In portrait, width is the constraint.

    // Target card width relative to screen
    let targetWidth;
    if (isLandscape) {
        // Landscape: Cards shouldn't be too huge, maybe 15-18% of height
        targetWidth = screenHeight * 0.18;
    } else {
        // Portrait: Cards take up ~25% of width in a row
        targetWidth = screenWidth * 0.22;
    }

    // Clamp values
    const width = Math.min(Math.max(targetWidth, 60), 140);
    const height = width * 1.4;

    return { width, height };
};

// Helper for general layout dimensions
export const getLayoutDimensions = (screenWidth: number, screenHeight: number) => {
    const isLandscape = screenWidth > screenHeight;

    return {
        isLandscape,
        contentPadding: spacing.md,
        // In landscape, left panel (decks) is 30% width
        leftPanelWidth: isLandscape ? screenWidth * 0.3 : screenWidth,
        // In landscape, right panel (cards) is 70% width
        rightPanelWidth: isLandscape ? screenWidth * 0.7 : screenWidth,
    };
};
