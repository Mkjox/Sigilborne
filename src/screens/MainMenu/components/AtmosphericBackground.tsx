import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme';

const FOG_COUNT = 3;
const WISP_COUNT = 15;
const FRAGMENT_COUNT = 6;

const ManaWisp: React.FC<{ index: number }> = ({ index }) => {
    const { width, height } = useWindowDimensions();
    const translateY = useSharedValue(Math.random() * (height + 200));
    const translateX = useSharedValue(Math.random() * (width + 200));
    const opacity = useSharedValue(0);
    const scale = useSharedValue(Math.random() * 0.5 + 0.5);

    useEffect(() => {
        const duration = 8000 + Math.random() * 12000;

        translateY.value = withRepeat(
            withTiming(translateY.value - 150, { duration, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );

        translateX.value = withRepeat(
            withTiming(translateX.value + (Math.random() - 0.5) * 100, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withDelay(duration * 0.5, withTiming(0.2, { duration: 2000 }))
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.wisp, animatedStyle]} />
    );
};

const ArcaneVein: React.FC<{ index: number }> = ({ index }) => {
    const opacity = useSharedValue(0.1);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.3, { duration: 3000 + index * 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Random vein paths
    const paths = [
        { top: '20%', left: -50, width: '40%', height: 2, rotate: '15deg' },
        { bottom: '30%', right: -50, width: '35%', height: 1.5, rotate: '-10deg' },
        { top: '60%', left: '10%', width: 2, height: '40%', rotate: '5deg' },
        { top: '10%', right: '5%', width: '30%', height: 1, rotate: '-20deg' },
    ];

    const p = paths[index % paths.length];

    return (
        <Animated.View
            style={[
                styles.vein,
                {
                    top: p.top as any,
                    left: p.left as any,
                    right: p.right as any,
                    bottom: p.bottom as any,
                    width: p.width as any,
                    height: p.height as any,
                    transform: [{ rotate: p.rotate || '0deg' }] as any
                },
                animatedStyle
            ]}
        />
    );
};

const FloatingFragment: React.FC<{ index: number }> = ({ index }) => {
    const { width, height } = useWindowDimensions();
    const translateY = useSharedValue(Math.random() * (height + 100));
    const translateX = useSharedValue(Math.random() * (width + 100));
    const rotate = useSharedValue(Math.random() * 360);

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(translateY.value + 30, { duration: 6000 + index * 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        rotate.value = withRepeat(
            withTiming(rotate.value + 10, { duration: 8000, easing: Easing.linear }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` }
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.fragment,
                {
                    width: 40 + (index * 15),
                    height: 30 + (index * 10),
                    opacity: 0.15 + (index * 0.05)
                },
                animatedStyle
            ]}
        />
    );
};

const ArcaneBloom: React.FC<{ color?: string }> = ({ color = colors.arcane.emeraldDark }) => {
    const opacity = useSharedValue(0.1);
    const scale = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.25, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        scale.value = withRepeat(
            withTiming(1.2, { duration: 5000 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.bloom, animatedStyle]}>
            <LinearGradient
                colors={[color, 'transparent']}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    );
};

export const AtmosphericBackground: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* 1. LAYER: DEEP VOID BACKDROP */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={[colors.arcane.obsidian, '#05070A']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* 2. LAYER: FLOATING FRAGMENTS */}
            {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => (
                <FloatingFragment key={`frag-${i}`} index={i} />
            ))}

            {/* 3. LAYER: ARCANE VEINS */}
            <ArcaneVein index={0} />
            <ArcaneVein index={1} />
            <ArcaneVein index={2} />
            <ArcaneVein index={3} />

            {/* 4. LAYER: ARCANE BLOOM (DYNAMIC CENTERS) */}
            <View style={[styles.glowContainer, { left: '15%', top: '20%' }]}>
                <ArcaneBloom color="rgba(16, 185, 129, 0.2)" />
            </View>
            <View style={[styles.glowContainer, { right: '10%', bottom: '25%' }]}>
                <ArcaneBloom color="rgba(6, 182, 212, 0.15)" />
            </View>

            {/* 5. LAYER: VOLUMETRIC LIGHT RAYS */}
            <LinearGradient
                colors={['rgba(16, 185, 129, 0.05)', 'transparent']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.4, y: 0.6 }}
                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
            />

            {/* 6. LAYER: MANA WISPS */}
            {Array.from({ length: WISP_COUNT }).map((_, i) => (
                <ManaWisp key={`wisp-${i}`} index={i} />
            ))}

            {/* DENSE VIGNETTE OVERLAY */}
            <LinearGradient
                colors={['rgba(0,0,0,0.85)', 'transparent', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.arcane.obsidian,
        overflow: 'hidden',
    },
    wisp: {
        position: 'absolute',
        width: 3,
        height: 3,
        backgroundColor: colors.arcane.emeraldLight,
        borderRadius: 1.5,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 8,
    },
    bloom: {
        width: 700,
        height: 700,
        borderRadius: 350,
        overflow: 'hidden',
    },
    glowContainer: {
        position: 'absolute',
        zIndex: 1,
    },
    vein: {
        position: 'absolute',
        backgroundColor: colors.arcane.emerald,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        zIndex: 2,
    },
    fragment: {
        position: 'absolute',
        backgroundColor: colors.arcane.graphite,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
    }
});
