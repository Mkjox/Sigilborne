// Theme exports
export { colors } from './colors';
export { typography, textStyles } from './typography';
export { spacing, borderRadius, shadows, zIndex, cardDimensions, boardDimensions } from './spacing';
export { animations } from './animations';

// Combined theme object
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows, zIndex, cardDimensions, boardDimensions } from './spacing';
import { animations } from './animations';

export const theme = {
    colors,
    typography,
    textStyles,
    spacing,
    borderRadius,
    shadows,
    zIndex,
    cardDimensions,
    boardDimensions,
    animations,
};

export type Theme = typeof theme;
