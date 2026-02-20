import React, { useEffect } from 'react';
import {
    StyleSheet,
    Pressable,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../../components/ui';
import { colors, spacing, shadows } from '../../../theme';

interface MenuButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    isLarge?: boolean;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
    title,
    onPress,
    variant = 'secondary',
    isLarge = false,
}) => {
    const isPrimary = variant === 'primary';
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const arcaneGlow = useAnimatedStyle(() => ({
        opacity: withRepeat(
            withTiming(isPrimary ? 0.4 : 0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        ),
    }));

    const buttonBodyStyles = [
        styles.buttonBody,
        isPrimary ? styles.primaryBody : styles.secondaryBody,
        isLarge && styles.largeBody,
    ];

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                style={styles.pressable}
            >
                {/* Emerald Energy Aura (Primary only) */}
                {isPrimary && (
                    <Animated.View style={[styles.aura, arcaneGlow]} />
                )}

                <View style={buttonBodyStyles}>
                    {/* Obsidian Texture (Dark Gradient) */}
                    <LinearGradient
                        colors={[colors.arcane.graphite, colors.arcane.obsidian]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    />

                    {/* Emerald Energy Seams (Borders) */}
                    <View style={[styles.energySeam, styles.seamTop]} />
                    <View style={[styles.energySeam, styles.seamBottom]} />
                    <View style={[styles.energySeamVertical, styles.seamLeft]} />
                    <View style={[styles.energySeamVertical, styles.seamRight]} />

                    {/* Sharper Internal Reflection */}
                    <View style={styles.reflection} />

                    <Text style={[
                        styles.text,
                        isPrimary ? styles.primaryText : styles.secondaryText,
                        isLarge && styles.largeText,
                    ]}>
                        {title}
                    </Text>

                    {/* Magical Rune Spark */}
                    <View style={styles.decorationContainer}>
                        <View style={styles.decoration} />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 3,
    },
    pressable: {
        width: '100%',
    },
    aura: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        borderRadius: 4,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        shadowOpacity: 0.6,
    },
    buttonBody: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    largeBody: {
        height: 50,
    },
    primaryBody: {
        borderColor: colors.arcane.emeraldDark,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    secondaryBody: {
        opacity: 0.9,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    energySeam: {
        position: 'absolute',
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.3,
        left: 0,
        right: 0,
    },
    energySeamVertical: {
        position: 'absolute',
        width: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.3,
        top: 0,
        bottom: 0,
    },
    seamTop: { top: 0 },
    seamBottom: { bottom: 0 },
    seamLeft: { left: 0 },
    seamRight: { right: 0 },
    reflection: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        fontFamily: 'serif',
        textTransform: 'uppercase',
    },
    largeText: {
        fontSize: 15,
        letterSpacing: 3,
    },
    primaryText: {
        color: colors.arcane.emerald,
        textShadowColor: 'rgba(16, 185, 129, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    secondaryText: {
        color: colors.arcane.white,
        opacity: 0.7,
    },
    decorationContainer: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
    },
    decoration: {
        width: 6,
        height: 6,
        backgroundColor: colors.arcane.emerald,
        transform: [{ rotate: '45deg' }],
        opacity: 0.2,
    },
});
