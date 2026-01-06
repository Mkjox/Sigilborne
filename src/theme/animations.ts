// Animation constants for Reanimated
export const animations = {
    // Duration in milliseconds
    duration: {
        instant: 0,
        fast: 150,
        normal: 250,
        slow: 400,
        verySlow: 600,
    },

    // Easing curves (for withTiming)
    easing: {
        linear: { easing: 'linear' as const },
        easeIn: { easing: 'ease-in' as const },
        easeOut: { easing: 'ease-out' as const },
        easeInOut: { easing: 'ease-in-out' as const },
    },

    // Spring configurations (for withSpring)
    spring: {
        gentle: {
            damping: 20,
            stiffness: 90,
            mass: 1,
        },
        bouncy: {
            damping: 10,
            stiffness: 100,
            mass: 1,
        },
        stiff: {
            damping: 15,
            stiffness: 200,
            mass: 1,
        },
    },
};
