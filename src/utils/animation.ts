import { useSettingsStore } from '../store/settingsStore';

/**
 * Multipliers for different animation speed settings.
 * Fast: 0.5x (half time)
 * Normal: 1.0x
 * Slow: 1.5x (longer time)
 */
export const SPEED_MULTIPLIERS = {
    fast: 0.5,
    normal: 1.0,
    slow: 1.5,
};

/**
 * Returns the adjusted duration based on the current user setting.
 * @param baseDuration The base duration in milliseconds.
 * @returns Adjusted duration in milliseconds.
 */
export const getAdjustedDuration = (baseDuration: number) => {
    const speed = useSettingsStore.getState().animationSpeed;
    const multiplier = SPEED_MULTIPLIERS[speed] || 1.0;
    return baseDuration * multiplier;
};

/**
 * A hook that returns a function to calculate adjusted durations.
 * Useful for components that need to respond to setting changes immediately.
 */
export const useAnimationMultiplier = () => {
    const speed = useSettingsStore(state => state.animationSpeed);
    const multiplier = SPEED_MULTIPLIERS[speed] || 1.0;
    
    return (baseDuration: number) => baseDuration * multiplier;
};

/**
 * Returns a spring configuration adjusted for the current speed setting.
 * @param baseConfig Optional base spring configuration.
 * @returns Adjusted spring configuration.
 */
export const getSpringConfig = (baseConfig: any = {}) => {
    const speed = useSettingsStore.getState().animationSpeed;
    const multiplier = SPEED_MULTIPLIERS[speed] || 1.0;
    
    return {
        ...baseConfig,
        stiffness: (baseConfig.stiffness || 100) / multiplier,
        damping: (baseConfig.damping || 10) / multiplier,
    };
};

/**
 * A hook that returns an adjusted spring configuration.
 */
export const useSpringConfig = (baseConfig: any = {}) => {
    const speed = useSettingsStore(state => state.animationSpeed);
    const multiplier = SPEED_MULTIPLIERS[speed] || 1.0;
    
    return {
        ...baseConfig,
        stiffness: (baseConfig.stiffness || 100) / multiplier,
        damping: (baseConfig.damping || 10) / multiplier,
    };
};
