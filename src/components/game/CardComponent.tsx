import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    interpolateColor,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardRarity } from '../../types';
import { Text } from '../ui';
import { colors, spacing, borderRadius, shadows, getCardDimensions } from '../../theme';

// Base card dimensions - will be scaled down for small screens
const BASE_CARD_WIDTH = 70;
const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * 1.4;

interface CardComponentProps {
    card: Card;
    onPress?: (event?: any) => void;
    isSelected?: boolean;
    isPlayable?: boolean;
    isSmall?: boolean;
    faceDown?: boolean;
    width?: number;
    height?: number;
    hideStats?: boolean;
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

/* UnitPowerDisplay declaration removed (defined at bottom) */

export const CardComponent: React.FC<CardComponentProps> = ({
    card,
    onPress,
    isSelected = false,
    isPlayable = true,
    isSmall = false,
    faceDown = false,
    width,
    height,
    hideStats = false,
}) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const defaultDims = getCardDimensions(windowWidth, windowHeight);

    // Determine actual dimensions to use
    let cardWidth = width || defaultDims.width;
    let cardHeight = height || defaultDims.height;

    // Apply small modifier if needed (legacy support)
    if (isSmall && !width) {
        cardWidth = cardWidth * 0.65;
        cardHeight = cardHeight * 0.65;
    }

    // Dynamic Scaling Calculations
    const badgeSize = cardHeight * 0.18; // 18% of card height
    const badgeFontSize = badgeSize * 0.55;
    const padding = cardHeight * 0.03;
    const typeSize = cardHeight * 0.16;

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
                    colors={['#3E1F0E', '#5A2E0C']} // Warm dark wood/leather for card back
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

    return (
        <AnimatedPressable
            onPress={isPlayable ? onPress : undefined}
            onPressIn={isPlayable ? handlePressIn : undefined}
            onPressOut={isPlayable ? handlePressOut : undefined}
            style={[animatedStyle, styles.cardContainer, { width: cardWidth, height: cardHeight }]}
        >
            {/* Glow effect for rare+ cards */}
            {card.rarity !== 'common' && (
                <View style={[styles.glowEffect]} />
            )}

            {/* Card border gradient */}
            <LinearGradient
                colors={gradientColors as [string, string]}
                style={[styles.cardBorder, { width: cardWidth, height: cardHeight }]}
            >
                {/* Card inner content */}
                <View style={[styles.cardInner, { width: cardWidth - 4, height: cardHeight - 4 }]}>

                    {/* Card type indicator (Top Left) */}

                    {!hideStats && (
                        <View style={[
                            styles.badgeBase,
                            {
                                top: padding, left: padding,
                                width: typeSize, height: typeSize, borderRadius: typeSize / 2, // Circular
                                backgroundColor: gradientColors[0],
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.3)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.5,
                                shadowRadius: 2,
                            }
                        ]}>
                            <Text style={[styles.badgeText, { fontSize: typeSize * 0.65, lineHeight: typeSize * 0.75, textAlign: 'center', textAlignVertical: 'center' }]}>
                                {card.type === 'unit'
                                    ? (card.row === 'melee' ? '⚔️' : (card.row === 'ranged' ? '🏹' : '🏰'))
                                    : (card.type === 'spell' ? '✨' : '🌧️')}
                            </Text>
                        </View>
                    )}

                    {/* Mana cost (Top Right) */}
                    {!hideStats && (
                        <View style={[
                            styles.badgeBase,
                            {
                                top: padding, right: padding,
                                width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, // Circular
                                backgroundColor: colors.accent[500],
                                borderWidth: 1,
                                borderColor: colors.primary[400], // Gold border
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.5,
                                shadowRadius: 2,
                            }
                        ]}>
                            <Text style={[styles.badgeText, { fontSize: badgeFontSize }]}>{card.manaCost}</Text>
                        </View>
                    )}

                    {/* Card art */}
                    <View style={styles.artContainer}>
                        {card.artwork ? (
                            <Image
                                source={card.artwork}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={['#2D2520', '#3E342B']} // Warm dark placeholder
                                style={styles.artPlaceholder}
                            >
                                <Text style={{ fontSize: cardHeight * 0.25 }}>
                                    {card.type === 'unit' ? '⚔️' : card.type === 'spell' ? '✨' : '🌧️'}
                                </Text>
                            </LinearGradient>
                        )}
                    </View>

                    {/* Card name */}
                    <View style={styles.nameContainer}>
                        <Text style={[styles.cardName, { fontSize: Math.max(8, cardHeight * 0.08) }]} numberOfLines={1}>
                            {card.name}
                        </Text>
                    </View>

                    {/* Power (Bottom Right) */}
                    {card.type === 'unit' && card.power !== undefined && (
                        <UnitPowerDisplay
                            power={card.power}
                            isHero={false}
                            size={badgeSize}
                            fontSize={badgeFontSize}
                            style={{ bottom: padding + 16, right: padding }}
                        />
                    )}

                    {/* Ability indicator (Bottom Left) */}
                    {card.abilities.length > 0 && !hideStats && (
                        <View style={[
                            styles.badgeBase,
                            {
                                bottom: padding + 16, left: padding,
                                width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, // Circular
                                backgroundColor: colors.primary[500],
                                borderWidth: 1,
                                borderColor: '#fff'
                            }
                        ]}>
                            <Text style={[styles.badgeText, { fontSize: badgeFontSize }]}>★</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* Selected overlay */}
            {isSelected && (
                <View style={[styles.selectedOverlay, { width: cardWidth, height: cardHeight, borderRadius: borderRadius.md }]} />
            )}

            {/* Disabled overlay */}
            {!isPlayable && (
                <View style={[styles.disabledOverlay, { width: cardWidth, height: cardHeight, borderRadius: borderRadius.md }]} />
            )}
        </AnimatedPressable>
    );
};

// Modified UnitPowerDisplay to accept size props
const UnitPowerDisplay: React.FC<{
    power: number;
    isHero?: boolean;
    size: number;
    fontSize: number;
    style?: any;
}> = ({ power, isHero, size, fontSize, style }) => {
    const prevPower = React.useRef(power);
    const colorAnim = useSharedValue(0);

    React.useEffect(() => {
        if (power > prevPower.current) {
            colorAnim.value = withSequence(withTiming(1, { duration: 200 }), withDelay(500, withTiming(0, { duration: 500 })));
        } else if (power < prevPower.current) {
            colorAnim.value = withSequence(withTiming(-1, { duration: 200 }), withDelay(500, withTiming(0, { duration: 500 })));
        }
        prevPower.current = power;
    }, [power]);

    const animatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            colorAnim.value,
            [-1, 0, 1],
            [colors.error, colors.secondary[500], colors.success]
        );
        return { backgroundColor };
    });

    return (
        <Animated.View style={[
            styles.badgeBase,
            style,
            animatedStyle,
            { width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' } // Circular
        ]}>
            <Text style={[styles.badgeText, { fontSize }]}>{power}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowEffect: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
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
        borderRadius: borderRadius.md, // Ensure inner follows outer
        overflow: 'hidden',
    },
    badgeBase: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 1,
        elevation: 2,
    },
    badgeText: {
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
    },
    artContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    artPlaceholder: {
        flex: 1,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    nameContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 2,
        paddingHorizontal: 4,
        zIndex: 4,
    },
    cardName: {
        textAlign: 'center',
        color: colors.text.primary,
    },
    selectedOverlay: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: colors.secondary[400],
        backgroundColor: 'rgba(255, 185, 0, 0.1)',
        zIndex: 10,
    },
    disabledOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10,
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
