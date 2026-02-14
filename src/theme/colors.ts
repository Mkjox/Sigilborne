// Color palette for Hearthstone-inspired board game aesthetic
export const colors = {
    // Primary colors - Rich Gold
    primary: {
        50: '#FFF9E6',
        100: '#FFEFC2',
        200: '#FFE599',
        300: '#FFDB70',
        400: '#E8C547', // Bright gold
        500: '#D4AF37', // Rich gold
        600: '#B8941F', // Darker gold
        700: '#9C7A0F', // Deep gold
        800: '#806000', // Bronze gold
        900: '#664600', // Dark bronze
    },

    // Secondary colors - Rich Brown (Wood/Leather)
    secondary: {
        50: '#F5E6D3',
        100: '#E0C9A8',
        200: '#CCAC7D',
        300: '#B88F52',
        400: '#A37239', // Light brown
        500: '#8B4513', // Saddle brown
        600: '#723A0F', // Dark brown
        700: '#5A2E0C', // Deep brown
        800: '#4A2511', // Very dark brown
        900: '#3E1F0E', // Almost black brown
    },

    // Accent colors - Bronze/Copper
    accent: {
        50: '#FFE8D9',
        100: '#FFD4B3',
        200: '#FFBF8C',
        300: '#FFAA66',
        400: '#E89051', // Light copper
        500: '#CD7F32', // Bronze
        600: '#B87333', // Dark copper
        700: '#A0672D', // Deep bronze
        800: '#885B27', // Dark bronze
        900: '#704F21', // Very dark bronze
    },

    // Tertiary colors - Warm Red (for accents/errors)
    tertiary: {
        50: '#FFE6E6',
        100: '#FFCCCC',
        200: '#FFB3B3',
        300: '#FF9999',
        400: '#E87C7C', // Light warm red
        500: '#D35F5F', // Warm red
        600: '#B84848', // Dark red
        700: '#9C3333', // Deep red
        800: '#802020', // Very dark red
        900: '#661111', // Almost black red
    },

    // Background colors - Parchment/Wood tones
    background: {
        primary: '#1A1410', // Very dark brown (for contrast)
        secondary: '#2D2520', // Dark brown
        tertiary: '#3E342B', // Medium dark brown
        card: '#4A3F35', // Card background
        elevated: '#5A4D41', // Elevated elements
        board: '#D4A574', // Light wood (for when we add textures)
        parchment: '#F4E4C1', // Parchment (for light areas)
    },

    // Rarity colors (keeping these as they work well)
    rarity: {
        common: '#9ca3af', // Gray
        rare: '#3b82f6', // Blue
        epic: '#a855f7', // Purple
        legendary: '#f59e0b', // Gold/Orange
    },

    // Semantic colors
    success: '#4A7C59', // Muted forest green
    error: '#D35F5F', // Warm red
    warning: '#E8C547', // Bright gold
    info: '#6B8CAE', // Muted blue

    // Text colors
    text: {
        primary: '#F4E4C1', // Parchment color
        secondary: '#D4C4A8', // Slightly darker parchment
        tertiary: '#B8A890', // Muted parchment
        disabled: '#8A7A68', // Very muted
        gold: '#D4AF37', // Gold for emphasis
    },

    // Border colors
    border: {
        primary: 'rgba(212, 175, 55, 0.3)', // Gold with transparency
        secondary: 'rgba(139, 69, 19, 0.2)', // Brown with transparency
        focus: 'rgba(212, 175, 55, 0.6)', // Bright gold
    },

    // Glassmorphism (now warmer)
    glass: {
        background: 'rgba(74, 63, 53, 0.7)', // Warm brown glass
        border: 'rgba(212, 175, 55, 0.2)', // Gold border
        shadow: 'rgba(26, 20, 16, 0.4)', // Dark brown shadow
    },
};

