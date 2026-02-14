import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, shadows } from '../../../theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

interface MenuPanelProps {
    children: React.ReactNode;
}

const CornerRune: React.FC<{ position: 'TL' | 'TR' | 'BL' | 'BR' }> = ({ position }) => {
    const opacity = useSharedValue(0.2);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        shadowOpacity: opacity.value,
    }));

    const posStyle = {
        TL: { top: 8, left: 8 },
        TR: { top: 8, right: 8 },
        BL: { bottom: 8, left: 8 },
        BR: { bottom: 8, right: 8 },
    }[position];

    return (
        <Animated.View style={[styles.rune, posStyle, animatedStyle]}>
            <View style={styles.runeInner} />
        </Animated.View>
    );
};

export const MenuPanel: React.FC<MenuPanelProps> = ({ children }) => {
    return (
        <View style={styles.outerBorder}>
            {/* Obsidian Edge Highlighting */}
            <View style={[styles.edgeHighlight, styles.highlightTop]} />
            <View style={[styles.edgeHighlight, styles.highlightLeft]} />

            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.graphite]}
                style={styles.panelContainer}
            >
                {/* Arcane Energy Seam */}
                <View style={styles.energySeam} />

                <View style={styles.innerContainer}>
                    <View style={styles.content}>
                        {children}
                    </View>
                </View>

                <View style={[styles.energySeam, styles.energySeamBottom]} />
            </LinearGradient>

            {/* Corner Runes */}
            <CornerRune position="TL" />
            <CornerRune position="TR" />
            <CornerRune position="BL" />
            <CornerRune position="BR" />
        </View>
    );
};

const styles = StyleSheet.create({
    outerBorder: {
        padding: 2,
        backgroundColor: '#000',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.arcane.graphite,
        ...shadows.xl,
    },
    panelContainer: {
        borderRadius: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    edgeHighlight: {
        position: 'absolute',
        backgroundColor: colors.arcane.emerald,
        opacity: 0.3,
        zIndex: 10,
    },
    highlightTop: { top: 0, left: 0, right: 0, height: 1 },
    highlightLeft: { top: 0, left: 0, bottom: 0, width: 1 },
    energySeam: {
        height: 1,
        backgroundColor: colors.arcane.emeraldDark,
        opacity: 0.4,
    },
    energySeamBottom: {
        marginTop: 0,
    },
    innerContainer: {
        margin: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },
    rune: {
        position: 'absolute',
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 4,
        zIndex: 15,
    },
    runeInner: {
        width: 6,
        height: 6,
        backgroundColor: colors.arcane.emerald,
        transform: [{ rotate: '45deg' }],
    },
});
