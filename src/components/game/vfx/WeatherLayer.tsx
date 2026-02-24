import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import { useWeather } from '../../../context/WeatherContext';
import { WeatherParticle } from './WeatherParticle';
import { colors } from '../../../theme';

export const WeatherLayer: React.FC = () => {
    const { weatherType, status } = useWeather();
    const isVisible = status !== 'idle' && status !== 'exiting';

    const tintStyle = useAnimatedStyle(() => {
        const targetColor = weatherType === 'frost'
            ? 'rgba(0, 255, 255, 0.05)'
            : (weatherType === 'fog' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0)');

        return {
            backgroundColor: withTiming(targetColor, { duration: 2000 }),
        };
    });

    const particles = useMemo(() => {
        if (weatherType === 'none') return [];

        const configs = weatherType === 'frost' ? [
            // Background Frost layer (Slower, smaller)
            ...Array.from({ length: 6 }).map((_, i) => ({
                id: `frost-bg-${i}`,
                color: 'rgba(165, 243, 252, 0.3)',
                size: 80,
                duration: 15000 + Math.random() * 5000,
                delay: i * 2000,
                verticalAmplitude: 20,
                opacity: 0.4,
            })),
            // Foreground Frost layer (Faster, larger)
            ...Array.from({ length: 4 }).map((_, i) => ({
                id: `frost-fg-${i}`,
                color: 'rgba(207, 250, 254, 0.5)',
                size: 140,
                duration: 10000 + Math.random() * 3000,
                delay: i * 2500,
                verticalAmplitude: 40,
                opacity: 0.6,
            }))
        ] : [
            // Background Fog layer (Dense, dark)
            ...Array.from({ length: 8 }).map((_, i) => ({
                id: `fog-bg-${i}`,
                color: 'rgba(6, 78, 59, 0.4)',
                size: 120,
                duration: 12000 + Math.random() * 4000,
                delay: i * 1500,
                verticalAmplitude: 30,
                opacity: 0.5,
            })),
            // Foreground Fog layer (Lighter, dynamic)
            ...Array.from({ length: 6 }).map((_, i) => ({
                id: `fog-fg-${i}`,
                color: 'rgba(16, 185, 129, 0.3)',
                size: 200,
                duration: 8000 + Math.random() * 2000,
                delay: i * 2000,
                verticalAmplitude: 50,
                opacity: 0.4,
            }))
        ];

        return configs;
    }, [weatherType]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Background Tint */}
            <Animated.View style={[StyleSheet.absoluteFill, tintStyle]} />

            {/* Atmosphere Layers */}
            {particles.map((p) => (
                <WeatherParticle
                    key={p.id}
                    {...p}
                    isVisible={status !== 'idle' && status !== 'exiting'}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    }
});
