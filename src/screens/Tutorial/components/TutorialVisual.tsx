import React, { useEffect } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';
import { Text } from '../../../components/ui';

interface Props {
    slideId: string;
}

// ─── PARTICLE SUB-COMPONENT (SLIDES 1 & 5) ──────────────────────────────────
const FloatingParticle: React.FC<{ delay: number; color: string; startX: number }> = ({
    delay,
    color,
    startX,
}) => {
    const yVal = useSharedValue(120);
    const opacityVal = useSharedValue(0);
    const scaleVal = useSharedValue(0.5);

    useEffect(() => {
        yVal.value = withDelay(
            delay,
            withRepeat(
                withTiming(-20, { duration: 3200, easing: Easing.out(Easing.ease) }),
                -1,
                false
            )
        );
        opacityVal.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 800 }),
                    withTiming(0.8, { duration: 1600 }),
                    withTiming(0, { duration: 800 })
                ),
                -1,
                false
            )
        );
        scaleVal.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 1600 }),
                    withTiming(0.6, { duration: 1600 })
                ),
                -1,
                true
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: yVal.value }, { scale: scaleVal.value }],
        opacity: opacityVal.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                { left: startX, backgroundColor: color, shadowColor: color },
                style,
            ]}
        />
    );
};

// ─── VISUAL 1: PORTAL (SLIDE 1) ──────────────────────────────────────────────
const PortalVisual: React.FC = () => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(0.95);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 12000, easing: Easing.linear }),
            -1,
            false
        );
        scale.value = withRepeat(
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    }));

    const innerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Ambient Background Glow */}
            <Animated.View style={[styles.portalGlow, innerStyle]} />

            {/* Rotating Runic Ring */}
            <Animated.View style={[styles.portalRing, ringStyle]}>
                <View style={[styles.runeNode, { top: 0, left: '50%', marginLeft: -4 }]} />
                <View style={[styles.runeNode, { bottom: 0, left: '50%', marginLeft: -4 }]} />
                <View style={[styles.runeNode, { left: 0, top: '50%', marginTop: -4 }]} />
                <View style={[styles.runeNode, { right: 0, top: '50%', marginTop: -4 }]} />
            </Animated.View>

            {/* Core Orb */}
            <View style={styles.portalCore}>
                <LinearGradient
                    colors={[colors.arcane.emerald, 'rgba(16, 185, 129, 0.2)']}
                    style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={24} color={colors.arcane.white} style={styles.sparkle} />
            </View>

            {/* Particle Stream */}
            <FloatingParticle delay={0} color={colors.arcane.emerald} startX={40} />
            <FloatingParticle delay={600} color={colors.arcane.white} startX={70} />
            <FloatingParticle delay={1200} color={colors.arcane.emerald} startX={100} />
            <FloatingParticle delay={1800} color={colors.arcane.white} startX={55} />
        </View>
    );
};

// ─── VISUAL 2: CRYSTALS & COINS (SLIDE 2) ────────────────────────────────────
const ManaWealthVisual: React.FC = () => {
    const flareScale = useSharedValue(0.7);
    const crystalGlows = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];

    useEffect(() => {
        flareScale.value = withRepeat(
            withTiming(1.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        // Staggered crystal breathing glows
        crystalGlows.forEach((glow, idx) => {
            glow.value = withDelay(
                idx * 400,
                withRepeat(
                    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                    -1,
                    true
                )
            );
        });
    }, []);

    const flareStyle = useAnimatedStyle(() => ({
        transform: [{ scale: flareScale.value }],
        opacity: flareScale.value,
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Gold Coins Stack */}
            <View style={styles.coinStackContainer}>
                {/* Coin Bottom */}
                <View style={[styles.coin, { transform: [{ translateY: 15 }] }]}>
                    <LinearGradient colors={['#F59E0B', '#B45309']} style={StyleSheet.absoluteFill} />
                </View>
                {/* Coin Middle */}
                <View style={[styles.coin, { transform: [{ translateY: 5 }] }]}>
                    <LinearGradient colors={['#FBBF24', '#D97706']} style={StyleSheet.absoluteFill} />
                </View>
                {/* Coin Top */}
                <View style={[styles.coin, { transform: [{ translateY: -5 }] }]}>
                    <LinearGradient colors={['#FDE68A', '#F59E0B']} style={StyleSheet.absoluteFill} />
                    <FontAwesome5 name="coins" size={14} color="#78350F" style={styles.coinIcon} />
                </View>

                {/* Shining lens flare overlay on top of coins */}
                <Animated.View style={[styles.lensFlare, flareStyle]} />
            </View>

            {/* Mana Crystal Row */}
            <View style={styles.crystalRow}>
                {crystalGlows.map((glowVal, idx) => {
                    const crystalStyle = useAnimatedStyle(() => ({
                        opacity: glowVal.value,
                        transform: [{ scale: 0.8 + glowVal.value * 0.2 }],
                    }));
                    return (
                        <View key={idx} style={styles.crystalWrapper}>
                            {/* Inner Crystal Shape */}
                            <Animated.View style={[styles.manaCrystal, crystalStyle]}>
                                <LinearGradient
                                    colors={['#60A5FA', '#1D4ED8']}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                            {/* Glow halo behind crystal */}
                            <Animated.View style={[styles.manaCrystalGlow, crystalStyle]} />
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// ─── VISUAL 3: MINI SIGIL CARD (SLIDE 3) ─────────────────────────────────────
const SigilCardVisual: React.FC = () => {
    // 0: Mana, 1: Attack, 2: Vitality
    const activeStat = useSharedValue(0);

    useEffect(() => {
        activeStat.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 1800 }),
                withTiming(1, { duration: 1800 }),
                withTiming(2, { duration: 1800 })
            ),
            -1,
            false
        );
    }, []);

    const manaHighlightStyle = useAnimatedStyle(() => ({
        transform: [{ scale: activeStat.value === 0 ? withTiming(1.3) : withTiming(0.9) }],
        opacity: activeStat.value === 0 ? withTiming(0.95) : withTiming(0),
        borderColor: colors.arcane.emerald,
    }));

    const attackHighlightStyle = useAnimatedStyle(() => ({
        transform: [{ scale: activeStat.value === 1 ? withTiming(1.3) : withTiming(0.9) }],
        opacity: activeStat.value === 1 ? withTiming(0.95) : withTiming(0),
        borderColor: '#F59E0B',
    }));

    const vitalityHighlightStyle = useAnimatedStyle(() => ({
        transform: [{ scale: activeStat.value === 2 ? withTiming(1.3) : withTiming(0.9) }],
        opacity: activeStat.value === 2 ? withTiming(0.95) : withTiming(0),
        borderColor: '#EF4444',
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Scaling Mock Card */}
            <View style={styles.miniCard}>
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 7, 12, 0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Inside card art illustration block */}
                <View style={styles.miniCardArt}>
                    <Ionicons name="shield-half" size={32} color="rgba(16, 185, 129, 0.35)" />
                </View>

                {/* MANA STAT (TOP LEFT) */}
                <View style={[styles.statNode, { top: -6, left: -6, backgroundColor: '#1E3A8A', borderColor: '#3B82F6' }]}>
                    <RNText style={styles.statNodeText}>3</RNText>
                    {/* Animated target highlight rings */}
                    <Animated.View style={[styles.statHighlightRing, manaHighlightStyle]} />
                </View>

                {/* ATTACK STAT (BOTTOM LEFT) */}
                <View style={[styles.statNode, { bottom: -6, left: -6, backgroundColor: '#78350F', borderColor: '#F59E0B' }]}>
                    <RNText style={styles.statNodeText}>4</RNText>
                    <Animated.View style={[styles.statHighlightRing, attackHighlightStyle]} />
                </View>

                {/* VITALITY STAT (BOTTOM RIGHT) */}
                <View style={[styles.statNode, { bottom: -6, right: -6, backgroundColor: '#7F1D1D', borderColor: '#EF4444' }]}>
                    <RNText style={styles.statNodeText}>5</RNText>
                    <Animated.View style={[styles.statHighlightRing, vitalityHighlightStyle]} />
                </View>
            </View>
        </View>
    );
};

// ─── VISUAL 4: FACTION SYNERGY BRIDGE (SLIDE 4) ──────────────────────────────
const FactionSynergyVisual: React.FC = () => {
    const arcScale = useSharedValue(0.85);

    useEffect(() => {
        arcScale.value = withRepeat(
            withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const arcStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: arcScale.value }],
        opacity: 0.4 + (arcScale.value - 0.85) * 4,
    }));

    return (
        <View style={styles.centerContainer}>
            <View style={styles.factionWrapper}>
                {/* Arcane Card */}
                <View style={[styles.synergyCard, { borderColor: '#8B5CF6' }]}>
                    <LinearGradient colors={['#2E1065', '#020617']} style={StyleSheet.absoluteFill} />
                    <MaterialCommunityIcons name="eye-outline" size={20} color="#C084FC" />
                    <Text style={styles.synergyCardLabel}>ARCANE</Text>
                </View>

                {/* Connecting Arcane-Nature Energy Link */}
                <View style={styles.energyLinkContainer}>
                    <Animated.View style={[styles.energyLinkLine, arcStyle]}>
                        <LinearGradient
                            colors={['#8B5CF6', colors.arcane.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                    <Ionicons name="flash" size={14} color="#C084FC" style={styles.flashIcon} />
                </View>

                {/* Nature Card */}
                <View style={[styles.synergyCard, { borderColor: colors.arcane.emerald }]}>
                    <LinearGradient colors={['#064E3B', '#020617']} style={StyleSheet.absoluteFill} />
                    <MaterialCommunityIcons name="leaf" size={20} color="#34D399" />
                    <Text style={styles.synergyCardLabel}>NATURE</Text>
                </View>
            </View>
        </View>
    );
};

// ─── SNOW PARTICLE SUB-COMPONENT (SLIDE 5 DIORAMA) ───────────────────────────
const SnowParticle: React.FC<{ delay: number; scale: number; startX: number }> = ({
    delay,
    scale,
    startX,
}) => {
    const xVal = useSharedValue(startX);
    const yVal = useSharedValue(-5);
    const opacityVal = useSharedValue(0);

    useEffect(() => {
        // Drift diagonally down-left from startX down to y=57, drifting left by 16px
        yVal.value = withDelay(
            delay,
            withRepeat(
                withTiming(57, { duration: 2500, easing: Easing.linear }),
                -1,
                false
            )
        );
        xVal.value = withDelay(
            delay,
            withRepeat(
                withTiming(startX - 16, { duration: 2500, easing: Easing.linear }),
                -1,
                false
            )
        );
        opacityVal.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 500 }),
                    withTiming(0.8, { duration: 1500 }),
                    withTiming(0, { duration: 500 })
                ),
                -1,
                false
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: xVal.value }, { translateY: yVal.value }, { scale }],
        opacity: opacityVal.value,
    }));

    return (
        <Animated.View
            style={[
                styles.snowParticle,
                style,
            ]}
        />
    );
};

// ─── VISUAL 5: WEATHER DEBUFF (SLIDE 5) ──────────────────────────────────────
const WeatherDebuffVisual: React.FC = () => {
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.3);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withTiming(1.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        pulseOpacity.value = withRepeat(
            withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Themed Unit Card */}
            <View style={styles.miniCard}>
                <LinearGradient
                    colors={['rgba(30, 64, 175, 0.15)', 'rgba(5, 7, 12, 0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Card Art showing weather state */}
                <View style={styles.miniCardArt}>
                    <Ionicons name="thunderstorm" size={32} color="rgba(96, 165, 250, 0.3)" />

                    {/* Confined Snow globe particles */}
                    <SnowParticle delay={0} scale={0.7} startX={20} />
                    <SnowParticle delay={500} scale={1.2} startX={42} />
                    <SnowParticle delay={1000} scale={0.9} startX={15} />
                    <SnowParticle delay={1500} scale={0.8} startX={48} />
                    <SnowParticle delay={2000} scale={1.1} startX={32} />
                </View>

                {/* Normal Mana Cost */}
                <View style={[styles.statNode, { top: -6, left: -6, backgroundColor: '#1E3A8A', borderColor: '#3B82F6' }]}>
                    <RNText style={styles.statNodeText}>4</RNText>
                </View>

                {/* Normal Vitality */}
                <View style={[styles.statNode, { bottom: -6, right: -6, backgroundColor: '#7F1D1D', borderColor: '#EF4444' }]}>
                    <RNText style={styles.statNodeText}>6</RNText>
                </View>

                {/* DEBUFFED ATTACK VALUE (Glows Red 1) */}
                <View style={[styles.statNode, { bottom: -6, left: -6, backgroundColor: '#7F1D1D', borderColor: '#EF4444' }]}>
                    <RNText style={[styles.statNodeText, styles.debuffedText]}>1</RNText>
                    {/* Pulsing red ring to display state */}
                    <Animated.View style={[styles.debuffPulse, animatedPulseStyle]} />
                </View>
            </View>

            {/* Ambient background snow particles floating upward */}
            <FloatingParticle delay={0} color="#BFDBFE" startX={30} />
            <FloatingParticle delay={1500} color="#DBEAFE" startX={80} />
        </View>
    );
};

// ─── VISUAL 6: DECK CUSTOMIZATION (FREE DECK EDIT SIMULATOR) ─────────────────
const LockedPathVisual: React.FC = () => {
    const cardOffset = useSharedValue(22);
    const cardOpacity = useSharedValue(0);
    const deckPulse = useSharedValue(1);

    React.useEffect(() => {
        const runCycle = () => {
            // 1. Move card from vault (below) up into the deck stack
            cardOffset.value = withTiming(-6, { duration: 700, easing: Easing.out(Easing.back(1)) });
            cardOpacity.value = withTiming(1, { duration: 400 });

            // 2. Pulse the deck once card is inserted
            setTimeout(() => {
                deckPulse.value = withSequence(
                    withTiming(1.08, { duration: 150 }),
                    withTiming(1, { duration: 150 })
                );
            }, 600);

            // 3. Move card back down (out of deck) after showing it
            setTimeout(() => {
                cardOffset.value = withTiming(22, { duration: 600, easing: Easing.in(Easing.ease) });
                cardOpacity.value = withTiming(0, { duration: 400 });
            }, 1800);
        };

        runCycle();
        const timer = setInterval(runCycle, 2800);
        return () => clearInterval(timer);
    }, []);

    const floatingCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: cardOffset.value }],
        opacity: cardOpacity.value,
    }));

    const deckStyle = useAnimatedStyle(() => ({
        transform: [{ scale: deckPulse.value }],
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Miniature Overlapping Card Deck Stack */}
            <Animated.View style={[styles.deckContainer, deckStyle]}>
                {/* Back card */}
                <View style={[styles.miniDeckCard, styles.deckCardBack]}>
                    <LinearGradient colors={['rgba(16, 185, 129, 0.04)', 'rgba(5, 7, 12, 0.95)']} style={StyleSheet.absoluteFill} />
                </View>

                {/* Middle card */}
                <View style={[styles.miniDeckCard, styles.deckCardMiddle]}>
                    <LinearGradient colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 7, 12, 0.95)']} style={StyleSheet.absoluteFill} />
                </View>

                {/* Front card */}
                <View style={[styles.miniDeckCard, styles.deckCardFront]}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 7, 12, 0.95)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <FontAwesome5
                        name="clone"
                        size={16}
                        color="rgba(16, 185, 129, 0.45)"
                    />
                </View>
            </Animated.View>

            {/* Customized Active Card sliding into the deck */}
            <Animated.View style={[styles.customizingCard, floatingCardStyle]}>
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.25)', 'rgba(5, 7, 12, 0.98)']}
                    style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={12} color={colors.arcane.emerald} />
            </Animated.View>

            {/* Edit Indicator overlay */}
            <View style={styles.editIndicatorPill}>
                <Ionicons name="add-circle" size={10} color={colors.arcane.emerald} />
            </View>

            {/* Stages & State Pill Badge at bottom */}
            <View style={styles.stagesBadge}>
                <RNText style={styles.stagesBadgeText}>
                    DECK UNLOCKED: EDIT FREELY
                </RNText>
            </View>
        </View>
    );
};

// ─── VISUAL 7: COMBAT STRIKE SEQUENCER (SLIDE 7) ─────────────────────────────
const CombatStrikeVisual: React.FC = () => {
    const cardY = useSharedValue(60);
    const enemyScale = useSharedValue(1);
    const slashScale = useSharedValue(0);
    const slashOpacity = useSharedValue(0);

    useEffect(() => {
        const playSequence = () => {
            // Step 1: Slide Player card backward slightly to charge
            cardY.value = withSequence(
                withTiming(72, { duration: 350 }),
                // Step 2: Thrust forward rapidly to strike
                withTiming(-20, { duration: 150, easing: Easing.out(Easing.quad) }, (finished) => {
                    if (finished) {
                        // Impact strikes! Trigger shockwave & enemy recoil
                        enemyScale.value = withSequence(
                            withTiming(0.85, { duration: 80 }),
                            withTiming(1.05, { duration: 150 }),
                            withTiming(1, { duration: 150 })
                        );
                        // Trigger slash visual flash
                        slashScale.value = withTiming(1.4, { duration: 250 });
                        slashOpacity.value = withSequence(
                            withTiming(1, { duration: 50 }),
                            withTiming(0, { duration: 200 })
                        );
                    }
                }),
                // Step 3: Glide back smoothly to default position
                withDelay(600, withTiming(60, { duration: 500 }))
            );

            // Reset slash values in sync
            setTimeout(() => {
                slashScale.value = 0;
            }, 1200);
        };

        // Run instantly and repeat sequence on loop every 2 seconds
        playSequence();
        const timer = setInterval(playSequence, 2000);
        return () => clearInterval(timer);
    }, []);

    const playerCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: cardY.value }],
    }));

    const enemyCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: enemyScale.value }],
    }));

    const slashStyle = useAnimatedStyle(() => ({
        transform: [{ scale: slashScale.value }, { rotate: '-25deg' }],
        opacity: slashOpacity.value,
    }));

    return (
        <View style={styles.centerContainer}>
            {/* Enemy Hero Card (Target) */}
            <Animated.View style={[styles.synergyCard, styles.enemyHeroCard, enemyCardStyle]}>
                <LinearGradient colors={['#7F1D1D', '#020617']} style={StyleSheet.absoluteFill} />
                <FontAwesome5 name="skull" size={16} color="#FCA5A5" />
                <Text style={[styles.synergyCardLabel, { color: '#FCA5A5' }]}>ENEMY HERO</Text>

                {/* Slash Shockwave strike impact overlay */}
                <Animated.View style={[styles.slashStrike, slashStyle]} />
            </Animated.View>

            {/* Combat sword trails or arrows representing tactical focus */}
            <View style={styles.strikeTrailLine} />

            {/* Player Attacking Unit Card */}
            <Animated.View style={[styles.synergyCard, styles.playerCombatCard, playerCardStyle]}>
                <LinearGradient colors={['#064E3B', '#020617']} style={StyleSheet.absoluteFill} />
                <FontAwesome5 name="fist-raised" size={16} color="#34D399" />
                <Text style={[styles.synergyCardLabel, { color: '#34D399' }]}>YOUR UNIT</Text>
            </Animated.View>
        </View>
    );
};

// ─── MAIN CONTROLLER COMPONENT ───────────────────────────────────────────────
export const TutorialVisual: React.FC<Props> = ({ slideId }) => {
    switch (slideId) {
        case '1':
            return <PortalVisual />;
        case '2':
            return <ManaWealthVisual />;
        case '3':
            return <SigilCardVisual />;
        case '4':
            return <FactionSynergyVisual />;
        case '5':
            return <WeatherDebuffVisual />;
        case '6':
            return <LockedPathVisual />;
        case '7':
            return <CombatStrikeVisual />;
        default:
            return <PortalVisual />;
    }
};

const styles = StyleSheet.create({
    centerContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    // Particle
    particle: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },

    // Visual 1: Portal
    portalGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
    },
    portalRing: {
        position: 'absolute',
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 1.5,
        borderColor: 'rgba(16, 185, 129, 0.35)',
        borderStyle: 'dashed',
    },
    runeNode: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.arcane.emerald,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 3,
    },
    portalCore: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    sparkle: {
        shadowColor: colors.arcane.white,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },

    // Visual 2: Crystals & Coins
    coinStackContainer: {
        position: 'absolute',
        left: 10,
        bottom: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coin: {
        position: 'absolute',
        width: 32,
        height: 12,
        borderRadius: 6,
        borderWidth: 0.8,
        borderColor: '#78350F',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#78350F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
    },
    coinIcon: {
        lineHeight: 12,
    },
    lensFlare: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FFFBEB',
        top: -6,
        right: 4,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
    },
    crystalRow: {
        flexDirection: 'row',
        position: 'absolute',
        right: 6,
        bottom: 22,
        gap: 4,
    },
    crystalWrapper: {
        width: 12,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manaCrystal: {
        width: 8,
        height: 18,
        borderRadius: 4,
        transform: [{ rotate: '45deg' }],
        borderWidth: 0.5,
        borderColor: '#93C5FD',
        zIndex: 5,
    },
    manaCrystalGlow: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#3B82F6',
        opacity: 0.3,
        filter: 'blur(3px)' as any,
    },

    // Visual 3: Mini Sigil Card
    miniCard: {
        width: 72,
        height: 102,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.35)',
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible', // allows nodes to sit on edges
    },
    miniCardArt: {
        width: 52,
        height: 52,
        backgroundColor: 'rgba(5, 7, 12, 0.7)',
        borderWidth: 0.5,
        borderColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    statNode: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    statNodeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    statHighlightRing: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        top: -4,
        left: -4,
    },

    // Visual 4: Faction Synergy
    factionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        gap: 6,
    },
    synergyCard: {
        width: 46,
        height: 64,
        borderWidth: 1,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    synergyCardLabel: {
        fontSize: 6,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    energyLinkContainer: {
        width: 20,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    energyLinkLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        borderRadius: 1.5,
    },
    flashIcon: {
        position: 'absolute',
        top: -6,
        zIndex: 5,
    },

    // Visual 5: Weather Debuff
    debuffedText: {
        color: '#EF4444',
        textShadowColor: '#EF4444',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    debuffPulse: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EF4444',
        opacity: 0.3,
    },
    snowParticle: {
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#E0F2FE',
        shadowColor: '#BAE6FD',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 3,
        zIndex: 20,
    },

    // Visual 6: Deck Customization (Free Deck Edit Simulator)
    deckContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    miniDeckCard: {
        position: 'absolute',
        width: 44,
        height: 60,
        borderRadius: 2,
        borderWidth: 0.8,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    deckCardBack: {
        borderColor: 'rgba(16, 185, 129, 0.1)',
        transform: [{ rotate: '-10deg' }, { translateX: -8 }, { translateY: -4 }],
        zIndex: 5,
    },
    deckCardMiddle: {
        borderColor: 'rgba(16, 185, 129, 0.15)',
        transform: [{ rotate: '5deg' }, { translateX: 6 }, { translateY: -2 }],
        zIndex: 8,
    },
    deckCardFront: {
        zIndex: 10,
    },
    customizingCard: {
        position: 'absolute',
        width: 32,
        height: 44,
        borderRadius: 2,
        borderWidth: 0.8,
        borderColor: colors.arcane.emerald,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 8,
    },
    editIndicatorPill: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(5, 7, 12, 0.95)',
        borderWidth: 0.8,
        borderColor: 'rgba(16, 185, 129, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 35,
        bottom: 22,
        right: 42,
    },
    stagesBadge: {
        position: 'absolute',
        bottom: -6,
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderRadius: 2,
        borderWidth: 0.8,
        zIndex: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    stagesBadgeText: {
        fontSize: 7.5,
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
        color: '#A7F3D0',
    },

    // Visual 7: Combat Strike
    enemyHeroCard: {
        borderColor: '#EF4444',
        position: 'absolute',
        top: 10,
    },
    playerCombatCard: {
        borderColor: colors.arcane.emerald,
        position: 'absolute',
    },
    strikeTrailLine: {
        position: 'absolute',
        width: 1,
        height: 60,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderStyle: 'dashed',
        zIndex: -1,
    },
    slashStrike: {
        position: 'absolute',
        width: 36,
        height: 6,
        backgroundColor: '#FFFBEB',
        borderRadius: 3,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 5,
    },
});
