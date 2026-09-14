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
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardRarity } from '../../types';
import { Text } from '../ui';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius, shadows, getCardDimensions } from '../../theme';
import { useAnimationMultiplier, useSpringConfig } from '../../utils/animation';

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
    animateEntry?: boolean;
    isAttacking?: boolean;
    isTakingHit?: boolean;
    isCombatReady?: boolean;
    attackDirection?: 'up' | 'down';
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
    animateEntry = false,
    isAttacking = false,
    isTakingHit = false,
    isCombatReady = false,
    attackDirection = 'up',
}) => {
    const { t } = useTranslation();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const anim = useAnimationMultiplier();
    const springConfig = useSpringConfig();
    const scale = useSharedValue(animateEntry ? 1.15 : 1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(animateEntry ? -36 : 0);
    const rotateX = useSharedValue(0);
    const rotateZ = useSharedValue(0);
    const damageFlash = useSharedValue(0);
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
        scale.value = withSpring(0.98, springConfig); // Reduced scale effect
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, springConfig);
    };

    // Arcane Slam Entry Animation
    React.useEffect(() => {
        if (animateEntry) {
            translateY.value = withSequence(
                withTiming(3, { duration: anim(150), easing: Easing.bezier(0.7, 0, 0.84, 0) }),
                withSpring(0, { mass: 0.7, stiffness: 220, damping: 14 })
            );
            scale.value = withSequence(
                withTiming(0.92, { duration: anim(150), easing: Easing.bezier(0.2, 0, 0, 1) }),
                withSpring(1, { mass: 0.7, stiffness: 220, damping: 14 })
            );
        }
    }, [animateEntry]);

    // Combat Attack Lunge Animation
    React.useEffect(() => {
        if (isAttacking) {
            const dir = attackDirection === 'down' ? 1 : -1;

            // 1. Anticipation coil (0-70ms): pulls back slightly away from target
            // 2. Explosive strike lunge (70-180ms): rushes into target
            // 3. Elastic spring recoil back to home slot (180-460ms)
            translateY.value = withSequence(
                withTiming(-dir * 16, { duration: anim(70), easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
                withTiming(dir * 85, { duration: anim(110), easing: Easing.bezier(0.12, 0.8, 0.32, 1) }),
                withSpring(0, { mass: 0.8, stiffness: 200, damping: 14 })
            );

            scale.value = withSequence(
                withTiming(0.92, { duration: anim(70) }),
                withTiming(1.18, { duration: anim(110) }),
                withSpring(1.0, { mass: 0.7, stiffness: 220, damping: 13 })
            );

            rotateX.value = withSequence(
                withTiming(dir * 16, { duration: anim(110) }),
                withSpring(0, { mass: 0.6, stiffness: 200, damping: 12 })
            );

            rotateZ.value = withSequence(
                withTiming(-3, { duration: anim(70) }),
                withTiming(3, { duration: anim(110) }),
                withSpring(0, { mass: 0.5, stiffness: 260, damping: 14 })
            );
        }
    }, [isAttacking, attackDirection, anim]);

    // Combat Hit Reaction (Impact Shudder + Crimson Flash)
    React.useEffect(() => {
        if (isTakingHit) {
            translateX.value = withSequence(
                withTiming(-12, { duration: anim(25) }),
                withTiming(12, { duration: anim(25) }),
                withTiming(-8, { duration: anim(25) }),
                withTiming(8, { duration: anim(25) }),
                withTiming(-3, { duration: anim(25) }),
                withTiming(0, { duration: anim(25) })
            );

            scale.value = withSequence(
                withTiming(0.86, { duration: anim(50) }),
                withSpring(1.0, { mass: 0.5, stiffness: 260, damping: 10 })
            );

            damageFlash.value = withSequence(
                withTiming(0.85, { duration: anim(35) }),
                withTiming(0, { duration: anim(300) })
            );
        }
    }, [isTakingHit, anim]);

    // Idle & Hover / Combat Ready Lift
    React.useEffect(() => {
        if (!isAttacking && !animateEntry && !isTakingHit) {
            if (isCombatReady) {
                translateY.value = withSpring(-12, springConfig);
            } else {
                translateY.value = withSpring(isSelected ? -8 : 0, springConfig);
            }
        }

        if (card.rarity === 'legendary' || isSelected || isTargeted || isCombatReady) {
            energyPulse.value = withRepeat(
                withTiming(1, { duration: anim(isCombatReady ? 700 : 1500), easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            energyPulse.value = 0;
        }
    }, [isSelected, isTargeted, isCombatReady, isAttacking, isTakingHit, card.rarity, anim, springConfig, animateEntry]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { perspective: 850 },
            { rotateX: `${rotateX.value}deg` },
            { rotateZ: `${rotateZ.value}deg` },
            { scale: scale.value },
        ],
    }));

    const damageFlashStyle = useAnimatedStyle(() => ({
        opacity: damageFlash.value,
    }));

    const energyStyle = useAnimatedStyle(() => ({
        opacity: interpolate(energyPulse.value, [0, 1], [0.35, 0.75]),
        transform: [{ scale: interpolate(energyPulse.value, [0, 1], [1, isCombatReady ? 1.06 : (isTargeted ? 1.05 : 1.02)]) }],
    }));

    const glowColor = isCombatReady
        ? '#f59e0b'
        : (isTargeted ? colors.error : (isSelected ? colors.arcane.emerald : rarityColors[card.rarity][0]));

    const gradientColors = isCombatReady
        ? ['#f59e0b', '#b45309']
        : (isTargeted
            ? [colors.error, '#991111']
            : (isSelected
                ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                : rarityColors[card.rarity]));

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
                {(card.rarity !== 'common' || isSelected || isTargeted || isCombatReady) && !faceDown && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.glowEffect,
                            energyStyle,
                            {
                                backgroundColor: glowColor,
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
                            padding: isSelected || isTargeted || isCombatReady ? 2 : 1
                        }
                    ]}
                >
                    <View style={[
                        styles.cardInner, 
                        { 
                            width: cardWidth - (isSelected || isTargeted || isCombatReady ? 4 : 2), 
                            height: cardHeight - (isSelected || isTargeted || isCombatReady ? 4 : 2) 
                        }
                    ]}>
                        {/* Combat Damage Flash Overlay */}
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: '#ef4444', borderRadius: 4, zIndex: 99 },
                                damageFlashStyle,
                            ]}
                        />
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
                                
                                {!hideStats && card.isHero && (
                                    <View style={[
                                        styles.statOrb,
                                        {
                                            width: badgeSize,
                                            height: badgeSize,
                                            borderRadius: badgeSize / 2,
                                            top: padding,
                                            left: padding,
                                            borderColor: colors.arcane.emeraldLight,
                                            borderWidth: 2,
                                            backgroundColor: colors.arcane.obsidian,
                                            shadowColor: colors.arcane.emeraldLight,
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.9,
                                            shadowRadius: 5,
                                            elevation: 6,
                                        }
                                    ]}>
                                        <Text
                                            variant="caption"
                                            style={[
                                                styles.statText,
                                                {
                                                    fontSize: badgeFontSize * 0.7,
                                                    lineHeight: badgeFontSize * 0.7,
                                                    color: colors.arcane.white,
                                                    fontWeight: '900',
                                                    fontFamily: undefined,
                                                }
                                            ]}
                                        >
                                            {`L${card.heroLevel ?? 1}`}
                                        </Text>
                                    </View>
                                )}

                                {!hideStats && !card.isHero && (
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
                                            <Text 
                                                variant="caption"
                                                style={[styles.statText, { fontSize: badgeFontSize, color: colors.arcane.cyan, lineHeight: badgeFontSize }]} 
                                                numberOfLines={1}
                                            >
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
                                                <Text 
                                                    variant="caption"
                                                    style={[styles.statText, { fontSize: badgeFontSize, color: colors.warning, lineHeight: badgeFontSize }]} 
                                                    numberOfLines={1}
                                                >
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
                                                <Text 
                                                    variant="caption"
                                                    style={[
                                                        styles.statText, 
                                                        { 
                                                            fontSize: badgeFontSize, 
                                                            lineHeight: badgeFontSize,
                                                            color: effectivePower !== undefined 
                                                                ? (effectivePower < (card.power || 0) ? colors.error : (effectivePower > (card.power || 0) ? colors.arcane.emerald : colors.arcane.white))
                                                                : colors.arcane.white
                                                        }
                                                    ]} 
                                                    numberOfLines={1}
                                                >
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
                                                        card.category === 'melee' ? require('../../../assets/classes/melee.png') :
                                                        card.category === 'ranged' ? require('../../../assets/classes/ranged.png') :
                                                        require('../../../assets/classes/siege.png')
                                                    }
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="contain"
                                                />
                                            </View>
                                        )}
                                    </>
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
        elevation: 5,
        overflow: 'hidden',
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
