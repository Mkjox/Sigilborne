import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardRarity } from '../../types';
import { Text } from '../ui';
import { colors, spacing, borderRadius, shadows } from '../../theme';

// Base card dimensions - will be scaled down for small screens
const BASE_CARD_WIDTH = 70;
const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * 1.4;

interface CardComponentProps {
    card: Card;
    onPress?: () => void;
    isSelected?: boolean;
    isPlayable?: boolean;
    isSmall?: boolean;
    faceDown?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Rarity color mappings
const rarityColors: Record<CardRarity, string[]> = {
    common: ['#6b7280', '#4b5563'],
    rare: ['#3b82f6', '#2563eb'],
    epic: ['#a855f7', '#7c3aed'],
    legendary: ['#f59e0b', '#d97706'],
};

const rarityGlow: Record<CardRarity, string> = {
    common: 'transparent',
    rare: 'rgba(59, 130, 246, 0.4)',
    epic: 'rgba(168, 85, 247, 0.5)',
    legendary: 'rgba(245, 158, 11, 0.6)',
};

export const CardComponent: React.FC<CardComponentProps> = ({
    card,
    onPress,
    isSelected = false,
    isPlayable = true,
    isSmall = false,
    faceDown = false,
}) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const cardWidth = isSmall ? BASE_CARD_WIDTH * 0.65 : BASE_CARD_WIDTH;
    const cardHeight = isSmall ? BASE_CARD_HEIGHT * 0.65 : BASE_CARD_HEIGHT;

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    React.useEffect(() => {
        translateY.value = withSpring(isSelected ? -10 : 0);
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    if (faceDown) {
        return (
            <Animated.View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
                <LinearGradient
                    colors={['#1e1e2e', '#2d2d42']}
                    style={[styles.card, { width: cardWidth, height: cardHeight }]}
                >
                    <View style={styles.cardBack}>
                        <View style={styles.cardBackPattern} />
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    }

    const gradientColors = rarityColors[card.rarity];
    const glowColor = rarityGlow[card.rarity];

    return (
        <AnimatedPressable
            onPress={isPlayable ? onPress : undefined}
            onPressIn={isPlayable ? handlePressIn : undefined}
            onPressOut={isPlayable ? handlePressOut : undefined}
            style={[animatedStyle, styles.cardContainer, { width: cardWidth, height: cardHeight }]}
        >
            {/* Glow effect for rare+ cards */}
            {card.rarity !== 'common' && (
                <View
                    style={[
                        styles.glowEffect,
                        {
                            backgroundColor: glowColor,
                            width: cardWidth + 8,
                            height: cardHeight + 8,
                        },
                    ]}
                />
            )}

            {/* Card border gradient */}
            <LinearGradient
                colors={gradientColors as [string, string]}
                style={[styles.cardBorder, { width: cardWidth, height: cardHeight }]}
            >
                {/* Card inner content */}
                <View style={[styles.cardInner, { width: cardWidth - 4, height: cardHeight - 4 }]}>
                    {/* Card type indicator */}
                    <View style={[styles.typeIndicator, { backgroundColor: gradientColors[0] }]}>
                        <Text variant="caption" style={styles.typeText}>
                            {card.type === 'unit' ? card.row?.charAt(0).toUpperCase() : card.type.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    {/* Mana cost */}
                    <View style={styles.manaCost}>
                        <Text variant="caption" style={styles.manaText}>{card.manaCost}</Text>
                    </View>

                    {/* Card art placeholder */}
                    <View style={styles.artContainer}>
                        <LinearGradient
                            colors={['#1a1a2e', '#16213e']}
                            style={styles.artPlaceholder}
                        >
                            <Text variant="caption" style={styles.artText}>
                                {card.type === 'unit' ? '⚔️' : card.type === 'spell' ? '✨' : '🌧️'}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Card name */}
                    <View style={styles.nameContainer}>
                        <Text variant="caption" style={styles.cardName} numberOfLines={1}>
                            {card.name}
                        </Text>
                    </View>

                    {/* Power (for unit cards) */}
                    {card.type === 'unit' && card.power !== undefined && (
                        <View style={styles.powerContainer}>
                            <Text variant="h3" style={styles.powerText}>{card.power}</Text>
                        </View>
                    )}

                    {/* Ability indicator */}
                    {card.abilities.length > 0 && (
                        <View style={styles.abilityIndicator}>
                            <Text variant="caption" style={styles.abilityText}>★</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* Selected overlay */}
            {isSelected && (
                <View style={[styles.selectedOverlay, { width: cardWidth, height: cardHeight }]} />
            )}

            {/* Disabled overlay */}
            {!isPlayable && (
                <View style={[styles.disabledOverlay, { width: cardWidth, height: cardHeight }]} />
            )}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowEffect: {
        position: 'absolute',
        borderRadius: borderRadius.lg,
        opacity: 0.6,
    },
    cardBorder: {
        borderRadius: borderRadius.md,
        padding: 2,
        ...shadows.md,
    },
    cardInner: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md - 2,
        overflow: 'hidden',
    },
    typeIndicator: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: 16,
        height: 16,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    typeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    manaCost: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accent[500],
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    manaText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    artContainer: {
        flex: 1,
        margin: 4,
        marginTop: 20,
    },
    artPlaceholder: {
        flex: 1,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    artText: {
        fontSize: 24,
    },
    nameContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    cardName: {
        fontSize: 8,
        textAlign: 'center',
        color: colors.text.primary,
    },
    powerContainer: {
        position: 'absolute',
        bottom: 20,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.secondary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    powerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.background.primary,
    },
    abilityIndicator: {
        position: 'absolute',
        bottom: 20,
        left: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    abilityText: {
        fontSize: 8,
        color: colors.secondary[400],
    },
    selectedOverlay: {
        position: 'absolute',
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.secondary[400],
        backgroundColor: 'rgba(255, 185, 0, 0.1)',
    },
    disabledOverlay: {
        position: 'absolute',
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    cardBack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
    },
    cardBackPattern: {
        width: '80%',
        height: '80%',
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.primary[700],
        backgroundColor: colors.primary[900],
    },
});
