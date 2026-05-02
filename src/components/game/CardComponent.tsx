import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    interpolateColor,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardRarity } from '../../types';
import { Text } from '../ui';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius, shadows, getCardDimensions } from '../../theme';

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
    isTargeted?: boolean;
    effectivePower?: number;
    onInfoPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Rarity color mappings - Arcane variants
const rarityColors: Record<CardRarity, string[]> = {
    common: [colors.arcane.graphite, colors.arcane.obsidian],
    rare: ['#3b82f6', '#1d4ed8'],
    epic: ['#a855f7', '#7e22ce'],
    legendary: [colors.arcane.emerald, colors.arcane.emeraldDark],
    boss: ['#DAA520', '#B8860B'],
};

export const CardComponent: React.FC<CardComponentProps> = ({
    card,
    onPress,
    isSelected = false,
    isTargeted = false,
    isPlayable = true,
    isSmall = false,
    faceDown = false,
    width,
    height,
    hideStats,
    effectivePower,
    onInfoPress,
}) => {
    const { t } = useTranslation();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const energyPulse = useSharedValue(0);

    const defaultDims = getCardDimensions(windowWidth, windowHeight);

    // Determine actual dimensions to use
    let cardWidth = width || defaultDims.width;
    let cardHeight = height || defaultDims.height;

    if (isSmall && !width) {
        cardWidth = cardWidth * 0.65;
        cardHeight = cardHeight * 0.65;
    }

    const badgeSize = cardHeight * 0.18; // Standardized diameter
    const badgeFontSize = badgeSize * 0.65; // Proportional font
    const padding = cardHeight * 0.05;

    const handlePressIn = () => {
        scale.value = withSpring(0.98); // Reduced scale effect
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    React.useEffect(() => {
        translateY.value = withSpring(isSelected ? -8 : 0); // Further softened lift

        if (card.rarity === 'legendary' || isSelected || isTargeted) {
            energyPulse.value = withRepeat(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            energyPulse.value = 0;
        }
    }, [isSelected, isTargeted, card.rarity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    const energyStyle = useAnimatedStyle(() => ({
        opacity: interpolate(energyPulse.value, [0, 1], [0.3, 0.6]),
        transform: [{ scale: interpolate(energyPulse.value, [0, 1], [1, isTargeted ? 1.05 : 1.02]) }],
    }));

    const gradientColors = isTargeted ? [colors.error, '#991111'] : (isSelected ? [colors.arcane.emerald, colors.arcane.emeraldDark] : rarityColors[card.rarity]);

    return (
        <Animated.View 
            style={[
                styles.cardContainer, 
                animatedStyle,
                { width: cardWidth, height: cardHeight }
            ]}
        >
            <Pressable 
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isPlayable}
                style={[styles.card, { width: cardWidth, height: cardHeight }]}
            >
                {/* Spectral Energy Glow */}
                {(card.rarity !== 'common' || isSelected || isTargeted) && !faceDown && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.glowEffect,
                            energyStyle,
                            {
                                backgroundColor: isTargeted ? colors.error : (isSelected ? colors.arcane.emerald : rarityColors[card.rarity][0]),
                                borderRadius: 2,
                                top: -2, left: -2, right: -2, bottom: -2,
                                zIndex: -1,
                            }
                        ]}
                    />
                )}

                <LinearGradient
                    colors={gradientColors as [string, string]}
                    style={[
                        styles.cardBorder, 
                        { 
                            width: cardWidth, 
                            height: cardHeight,
                            padding: isSelected || isTargeted ? 2 : 1
                        }
                    ]}
                >
                    <View style={[
                        styles.cardInner, 
                        { 
                            width: cardWidth - (isSelected || isTargeted ? 4 : 2), 
                            height: cardHeight - (isSelected || isTargeted ? 4 : 2) 
                        }
                    ]}>
                        {faceDown ? (
                            <View style={[styles.cardBack, { backgroundColor: colors.arcane.obsidian }]}>
                                <View style={[styles.cardBackPattern, { borderColor: colors.arcane.emeraldDark }]} />
                                <View style={styles.voidSigil}>
                                    <Text style={{ fontSize: cardHeight * 0.2, color: colors.arcane.emerald, opacity: 0.4 }}>✧</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.artContainer}>
                                {card.artwork ? (
                                    <Image
                                        source={card.artwork}
                                        style={styles.cardImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={[colors.arcane.graphite, colors.arcane.obsidian]}
                                        style={styles.artPlaceholder}
                                    >
                                        <Text style={{ fontSize: cardHeight * 0.3, opacity: 0.2, color: colors.arcane.emerald }}>
                                            {card.type === 'unit' ? '⚔' : (card.type === 'spell' ? '✨' : '☁')}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.artOverlay}
                                />
                                
                                {!hideStats && (
                                    <>
                                        {/* Mana Cost (Top Left) */}
                                        <View style={[
                                            styles.statOrb,
                                            {
                                                width: badgeSize,
                                                height: badgeSize,
                                                borderRadius: badgeSize / 2,
                                                top: padding,
                                                left: padding,
                                                borderColor: colors.arcane.cyan
                                            }
                                        ]}>
                                            <Text style={[styles.statText, { fontSize: badgeFontSize, color: colors.arcane.cyan }]} numberOfLines={1}>
                                                {card.manaCost}
                                            </Text>
                                        </View>

                                        {/* Attack (Bottom Left) */}
                                        {card.type === 'unit' && (
                                            <View style={[
                                                styles.statOrb,
                                                {
                                                    width: badgeSize,
                                                    height: badgeSize,
                                                    borderRadius: badgeSize / 2,
                                                    bottom: padding,
                                                    left: padding,
                                                    borderColor: colors.warning
                                                }
                                            ]}>
                                                <Text style={[styles.statText, { fontSize: badgeFontSize, color: colors.warning }]} numberOfLines={1}>
                                                    {card.attack}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Health/Power (Bottom Right) */}
                                        {card.type === 'unit' && (
                                            <View style={[
                                                styles.statOrb,
                                                {
                                                    width: badgeSize,
                                                    height: badgeSize,
                                                    borderRadius: badgeSize / 2,
                                                    bottom: padding,
                                                    right: padding,
                                                    borderColor: effectivePower !== undefined 
                                                        ? (effectivePower < (card.power || 0) ? colors.error : (effectivePower > (card.power || 0) ? colors.arcane.emerald : 'rgba(255,255,255,0.2)'))
                                                        : 'rgba(255,255,255,0.2)'
                                                }
                                            ]}>
                                                <Text style={[
                                                    styles.statText, 
                                                    { 
                                                        fontSize: badgeFontSize, 
                                                        color: effectivePower !== undefined 
                                                            ? (effectivePower < (card.power || 0) ? colors.error : (effectivePower > (card.power || 0) ? colors.arcane.emerald : colors.arcane.white))
                                                            : colors.arcane.white
                                                    }
                                                ]} numberOfLines={1}>
                                                    {effectivePower ?? card.power}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Class/Row Indicator (Top Right) */}
                                        {card.type === 'unit' && card.category && (
                                            <View style={[
                                                styles.statOrb,
                                                {
                                                    width: badgeSize,
                                                    height: badgeSize,
                                                    borderRadius: badgeSize / 2,
                                                    top: padding,
                                                    right: padding,
                                                    borderColor: colors.arcane.emerald,
                                                    backgroundColor: 'rgba(0,0,0,0.85)',
                                                    padding: badgeSize * 0.15,
                                                }
                                            ]}>
                                                <Image 
                                                    source={
                                                        card.category === 'melee' ? require('../../assets/icons/melee.png') :
                                                        card.category === 'ranged' ? require('../../assets/icons/ranged.png') :
                                                        require('../../assets/icons/siege.png')
                                                    }
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="contain"
                                                />
                                            </View>
                                        )}
                                    </>
                                )}

                                {/* Hero Indicator */}
                                {card.isHero && (
                                    <View style={[
                                        styles.statOrb,
                                        {
                                            width: badgeSize,
                                            height: badgeSize,
                                            borderRadius: badgeSize / 2,
                                            top: padding,
                                            left: padding,
                                            borderColor: colors.warning,
                                            backgroundColor: 'rgba(218, 165, 32, 0.2)', // Golden mist
                                        }
                                    ]}>
                                        <Text style={[
                                            styles.statText,
                                            { 
                                                fontSize: badgeFontSize * 0.8,
                                                color: undefined, 
                                                fontFamily: undefined 
                                            }
                                        ]}>👑</Text>
                                    </View>
                                )}

                                {/* Info Button (Spells Only - Top Right) */}
                                {!faceDown && card.type === 'spell' && onInfoPress && (
                                    <Pressable 
                                        onPress={onInfoPress} 
                                        style={[
                                            styles.statOrb,
                                            {
                                                width: badgeSize,
                                                height: badgeSize,
                                                borderRadius: badgeSize / 2,
                                                top: padding,
                                                right: padding,
                                                borderColor: colors.arcane.emerald,
                                                backgroundColor: 'rgba(0,0,0,0.85)',
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.infoIconText, { fontSize: badgeFontSize * 0.7 }]}>i</Text>
                                    </Pressable>
                                )}

                                {/* Name Bar */}
                                <View style={[styles.nameBar, { bottom: cardHeight * 0.26 }]}>
                                    <Text style={[styles.cardName, { fontSize: Math.max(6, cardHeight * 0.075) }]} numberOfLines={1}>
                                        {t(`cards.${card.name}`).toUpperCase()}
                                    </Text>
                                </View>

                                {/* Energy Seams */}
                                <View style={[styles.energySeam, { left: 0, top: '25%', bottom: '25%' }]} />
                                <View style={[styles.energySeam, { right: 0, top: '25%', bottom: '25%' }]} />
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Inactive Overlay */}
                {!isPlayable && (
                    <View
                        pointerEvents="none"
                        style={[styles.disabledOverlay, { width: cardWidth, height: cardHeight }]}
                    />
                )}
            </Pressable>


        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        borderRadius: 2,
        overflow: 'hidden',
    },
    glowEffect: {
        position: 'absolute',
        filter: 'blur(8px)',
    },
    cardBorder: {
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInner: {
        backgroundColor: colors.arcane.obsidian,
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    artContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    artOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    artPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statOrb: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    statText: {
        fontWeight: '900',
        fontFamily: 'serif',
        includeFontPadding: false,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    nameBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 1,
        zIndex: 5,
    },
    cardName: {
        color: colors.arcane.white,
        textAlign: 'center',
        fontWeight: '700',
        letterSpacing: 0.5,
        fontFamily: 'serif',
    },
    energySeam: {
        position: 'absolute',
        width: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.1,
    },
    disabledOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 20,
        borderRadius: 2,
    },
    cardBack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBackPattern: {
        width: '85%',
        height: '85%',
        borderWidth: 1,
        opacity: 0.1,
    },
    voidSigil: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoButton: {
        position: 'absolute',
        backgroundColor: colors.arcane.obsidian,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100, // Ensure it's above everything
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
    },
    infoIconText: {
        color: colors.arcane.emerald,
        fontWeight: '900',
        fontFamily: 'serif',
    }
});
