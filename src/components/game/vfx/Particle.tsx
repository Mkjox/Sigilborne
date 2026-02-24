import React, { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

interface ParticleProps {
    angle: number; // in radians
    distance: number;
    delay: number;
    color: string;
    size?: number;
}

export const Particle: React.FC<ParticleProps> = ({
    angle,
    distance,
    delay,
    color,
    size = 4
}) => {
    const progress = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Staggered start
        opacity.value = withDelay(delay, withTiming(1, { duration: 50 }));

        // Motion: Transition from center to distance
        progress.value = withDelay(delay, withTiming(1, {
            duration: 600 + Math.random() * 200,
            easing: Easing.out(Easing.quad)
        }));

        // Fade out during last half of progress
        opacity.value = withDelay(delay + 300, withTiming(0, { duration: 300 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const x = Math.cos(angle) * progress.value * distance;
        const y = Math.sin(angle) * progress.value * distance;

        const scale = interpolate(
            progress.value,
            [0, 0.2, 1],
            [0.5, 1.5, 0.2],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { scale }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.particle,
                { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
                animatedStyle
            ]}
        />
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
    },
});
