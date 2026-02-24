import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    runOnJS,
    Easing,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { Particle } from './Particle';
import { colors } from '../../../theme';

export type SpectralEffectType = 'scorch' | 'boost' | 'revive' | 'void_bolt';

interface SpectralEffectProps {
    type: SpectralEffectType;
    x: number;
    y: number;
    onComplete: () => void;
    onShake?: (intensity: number) => void;
}

export const SpectralEffect: React.FC<SpectralEffectProps> = ({
    type,
    x,
    y,
    onComplete,
    onShake
}) => {
    // Shared values for layers
    const glowScale = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const pulseScale = useSharedValue(0);
    const pulseOpacity = useSharedValue(0);

    // Semantic data
    const isDestructive = type === 'scorch' || type === 'void_bolt';
    const primaryColor = colors.arcane.emerald;
    const secondaryColor = isDestructive ? colors.error : colors.arcane.cyan;

    // Generate randomized particles
    const particles = useMemo(() => {
        const count = isDestructive ? 12 : 8;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            angle: (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25),
            distance: 80 + Math.random() * 60,
            delay: 120 + (i * 15), // Staggered start after anticipation
        }));
    }, [isDestructive]);

    useEffect(() => {
        // 1. Anticipation (120ms)
        glowScale.value = withTiming(0.4, { duration: 120, easing: Easing.in(Easing.quad) });
        glowOpacity.value = withTiming(0.4, { duration: 120 });

        // 2. Impact (Fast Burst)
        const impactDelay = 120;

        // Glow impact
        glowScale.value = withDelay(impactDelay, withSpring(2.5, { damping: 10, stiffness: 100 }));
        glowOpacity.value = withDelay(impactDelay, withTiming(0.8, { duration: 50 }));

        // Pulse impact
        pulseScale.value = withDelay(impactDelay, withSpring(3, { damping: 12, stiffness: 120 }));
        pulseOpacity.value = withDelay(impactDelay, withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(0, { duration: 600 })
        ));

        // Trigger Screen Shake for destructive effects
        if (isDestructive && onShake) {
            setTimeout(() => onShake(5), impactDelay);
        }

        // 3. Decay
        glowOpacity.value = withDelay(impactDelay + 400, withTiming(0, { duration: 400 }, (finished) => {
            if (finished) {
                runOnJS(onComplete)();
            }
        }));

    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
        backgroundColor: secondaryColor,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
        borderColor: primaryColor,
    }));

    return (
        <View style={[styles.container, { left: x - 50, top: y - 50 }]} pointerEvents="none">
            {/* Glow Layer */}
            <Animated.View style={[styles.glow, glowStyle]} />

            {/* Base Pulse Layer */}
            <Animated.View style={[styles.pulse, pulseStyle]} />

            {/* Particle Layer */}
            {particles.map((p, index) => (
                <Particle
                    key={p.id}
                    angle={p.angle}
                    distance={p.distance}
                    delay={p.delay}
                    color={index % 2 === 0 ? primaryColor : secondaryColor}
                    size={isDestructive ? 5 : 3}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    glow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        filter: 'blur(20px)',
    },
    pulse: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
    },
});
