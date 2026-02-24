import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withDelay,
    interpolate,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

interface WeatherParticleProps {
    color: string;
    size: number;
    duration: number;
    delay: number;
    verticalAmplitude: number;
    opacity: number;
    isVisible: boolean;
}

export const WeatherParticle: React.FC<WeatherParticleProps> = ({
    color,
    size,
    duration,
    delay,
    verticalAmplitude,
    opacity: targetOpacity,
    isVisible
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const progress = useSharedValue(0);
    const oscillation = useSharedValue(0);
    const masterOpacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            // Horizontal Drift
            progress.value = withDelay(
                delay,
                withRepeat(
                    withTiming(1, { duration, easing: Easing.linear }),
                    -1,
                    false
                )
            );

            // Vertical Oscillation
            oscillation.value = withRepeat(
                withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
                -1,
                true
            );

            // Entry/Exit
            masterOpacity.value = withTiming(1, { duration: 2000 });
        } else {
            masterOpacity.value = withTiming(0, { duration: 1500 });
        }

        return () => {
            cancelAnimation(progress);
            cancelAnimation(oscillation);
            cancelAnimation(masterOpacity);
        };
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            progress.value,
            [0, 1],
            [-size, screenWidth + size]
        );

        const translateY = interpolate(
            oscillation.value,
            [0, 1],
            [-verticalAmplitude, verticalAmplitude]
        );

        return {
            transform: [
                { translateX },
                { translateY }
            ],
            opacity: masterOpacity.value * targetOpacity,
        };
    });

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    width: size,
                    height: size * 0.6, // Blobs are wider than tall
                    backgroundColor: color,
                    borderRadius: size / 2,
                    top: Math.random() * screenHeight,
                },
                animatedStyle
            ]}
        />
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        // Blur equivalent through softness/low opacity as blur is expensive
        // Alternatively, use radial gradients if available, but for performance,
        // we use simple semi-transparent View.
    }
});
