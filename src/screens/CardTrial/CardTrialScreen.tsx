import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    StatusBar,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

type CardTrialNavigationProp = StackNavigationProp<RootStackParamList, 'CardTrial'>;

interface Props {
    navigation: CardTrialNavigationProp;
}

type RarityTier = 'common' | 'epic' | 'legendary';

const RARITY_CONFIGS: Record<RarityTier, {
    label: string;
    borderColors: [string, string, string, string];
    name: string;
    glyph: string;
    cost: number;
    atk: number;
    hp: number;
    shakeMultiplier: number;
    shockwaveColor: string;
    glowColor: string;
}> = {
    common: {
        label: 'COMMON',
        borderColors: ['#64748b', '#475569', '#334155', '#1e293b'],
        name: 'RUNIC SENTRY',
        glyph: '⬡',
        cost: 2,
        atk: 2,
        hp: 3,
        shakeMultiplier: 0.2,
        shockwaveColor: 'rgba(148, 163, 184, 0.4)',
        glowColor: '#94a3b8',
    },
    epic: {
        label: 'EPIC',
        borderColors: ['#c084fc', '#9333ea', '#6b21a8', '#3b0764'],
        name: 'VOID HARBINGER',
        glyph: '🜏',
        cost: 4,
        atk: 5,
        hp: 5,
        shakeMultiplier: 1.0,
        shockwaveColor: 'rgba(168, 85, 247, 0.5)',
        glowColor: '#c084fc',
    },
    legendary: {
        label: 'LEGENDARY',
        borderColors: ['#34d399', '#059669', '#047857', '#022c22'],
        name: 'VOID ARCHON',
        glyph: '🜂',
        cost: 7,
        atk: 8,
        hp: 8,
        shakeMultiplier: 1.8,
        shockwaveColor: 'rgba(52, 211, 153, 0.6)',
        glowColor: '#6ee7b7',
    },
};

export const CardTrialScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const [isPlayed, setIsPlayed] = useState(false);
    const [slowMo, setSlowMo] = useState(false);
    const [rarity, setRarity] = useState<RarityTier>('legendary');
    const [activePhase, setActivePhase] = useState('Idle in Hand');

    const config = RARITY_CONFIGS[rarity];

    const cardWidth = Math.min(windowWidth * 0.54, 210);
    const cardHeight = cardWidth * 1.45;

    // --- Dynamic Target Offsets ---
    const targetTranslateX = 0;
    const targetTranslateY = -windowHeight * 0.25;

    // --- Master Kinetic Drivers ---
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scaleX = useSharedValue(1);
    const scaleY = useSharedValue(1);
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);

    // --- Shadow Kinematics ---
    const shadowOffsetY = useSharedValue(6);
    const shadowRadius = useSharedValue(10);
    const shadowOpacity = useSharedValue(0.45);
    const shadowScale = useSharedValue(1);

    // --- Internal Secondary Motion Drivers ---
    const artParallaxX = useSharedValue(0);
    const artParallaxY = useSharedValue(0);
    const badgeLagY = useSharedValue(0);
    const badgeScaleX = useSharedValue(1);
    const badgeScaleY = useSharedValue(1);
    const specularProgress = useSharedValue(-1.2);
    const runeGlow = useSharedValue(0.2);

    // --- Environmental Shockwave & Screen Shake ---
    const shockwaveScale = useSharedValue(0.7);
    const shockwaveOpacity = useSharedValue(0);
    const screenShakeY = useSharedValue(0);

    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    const triggerHaptic = (tier: RarityTier) => {
        if (tier === 'legendary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        } else if (tier === 'epic') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
    };

    const updatePhaseLabel = (phase: string) => {
        setActivePhase(phase);
    };

    const clearActiveTimeouts = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    };

    const playArcaneSlam = () => {
        if (isPlayed) return;
        setIsPlayed(true);
        clearActiveTimeouts();

        const timeScale = slowMo ? 3.0 : 1.0;
        const dur = (ms: number) => ms * timeScale;
        const currentTier = rarity;
        const shakeMult = RARITY_CONFIGS[currentTier].shakeMultiplier;

        // PHASE 1: Lift & Coil (Anticipation) [0ms -> 80ms]
        runOnJS(updatePhaseLabel)('Phase 1: Lift & Coil (Anticipation)');

        translateY.value = withSequence(
            // Phase 1: dip down
            withTiming(18, { duration: dur(80), easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }),
            // Phase 2: high parabolic arc launch
            withTiming(targetTranslateY - 90, {
                duration: dur(140),
                easing: Easing.bezier(0.12, 0.8, 0.32, 1.0),
            }),
            // Phase 3: downward plunge spike
            withTiming(targetTranslateY + 4, {
                duration: dur(60),
                easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
            // Phase 5: elastic rebound overshoot
            withSpring(targetTranslateY, {
                mass: 0.85,
                stiffness: 220,
                damping: 14,
            })
        );

        translateX.value = withSequence(
            withTiming(0, { duration: dur(80) }),
            withTiming(targetTranslateX, {
                duration: dur(200),
                easing: Easing.bezier(0.12, 0.8, 0.32, 1.0),
            })
        );

        // Aspect ratio Squash & Stretch
        scaleX.value = withSequence(
            withTiming(0.94, { duration: dur(80), easing: Easing.bezier(0.35, 0, 0.25, 1.0) }),
            withTiming(1.14, { duration: dur(140), easing: Easing.bezier(0.12, 0.8, 0.32, 1.0) }),
            withTiming(0.98, { duration: dur(60) }),
            withTiming(1.15, { duration: dur(40), easing: Easing.bezier(0, 0, 0.2, 1) }),
            withTiming(0.94, { duration: dur(120), easing: Easing.bezier(0.25, 1, 0.5, 1) }),
            withSpring(1.0, { mass: 0.8, stiffness: 200, damping: 15 })
        );

        scaleY.value = withSequence(
            withTiming(0.92, { duration: dur(80), easing: Easing.bezier(0.35, 0, 0.25, 1.0) }),
            withTiming(1.22, { duration: dur(140), easing: Easing.bezier(0.12, 0.8, 0.32, 1.0) }),
            withTiming(1.12, { duration: dur(60) }),
            withTiming(0.88, { duration: dur(40), easing: Easing.bezier(0, 0, 0.2, 1) }),
            withTiming(1.08, { duration: dur(120), easing: Easing.bezier(0.25, 1, 0.5, 1) }),
            withSpring(1.0, { mass: 0.8, stiffness: 200, damping: 15 })
        );

        // 3D Rotations
        rotateX.value = withSequence(
            withTiming(8, { duration: dur(80) }),
            withTiming(-18, { duration: dur(140) }),
            withTiming(3, { duration: dur(60) }),
            withSpring(0, { mass: 0.7, stiffness: 200, damping: 12 })
        );

        rotateZ.value = withSequence(
            withTiming(-2, { duration: dur(80) }),
            withTiming(6, { duration: dur(140) }),
            withTiming(0, { duration: dur(60) }),
            withSequence(
                withTiming(-1.5, { duration: dur(30) }),
                withTiming(1.5, { duration: dur(30) }),
                withSpring(0, { mass: 0.5, stiffness: 300, damping: 15 })
            )
        );

        // Shadow Detachment & Collapse
        shadowOffsetY.value = withSequence(
            withTiming(2, { duration: dur(80) }),
            withTiming(45, { duration: dur(140) }),
            withTiming(2, { duration: dur(60) }),
            withTiming(12, { duration: dur(120) }),
            withSpring(6, { mass: 0.8, stiffness: 180, damping: 14 })
        );

        shadowRadius.value = withSequence(
            withTiming(4, { duration: dur(80) }),
            withTiming(32, { duration: dur(140) }),
            withTiming(3, { duration: dur(60) }),
            withTiming(16, { duration: dur(120) }),
            withSpring(10, { mass: 0.8, stiffness: 180, damping: 14 })
        );

        shadowOpacity.value = withSequence(
            withTiming(0.6, { duration: dur(80) }),
            withTiming(0.2, { duration: dur(140) }),
            withTiming(0.85, { duration: dur(60) }),
            withTiming(0.4, { duration: dur(120) }),
            withTiming(0.5, { duration: dur(180) })
        );

        shadowScale.value = withSequence(
            withTiming(0.95, { duration: dur(80) }),
            withTiming(0.75, { duration: dur(140) }),
            withTiming(1.15, { duration: dur(60) }),
            withSpring(1.0, { mass: 0.7, stiffness: 180, damping: 12 })
        );

        // Parallax Artwork Counter-Drift
        artParallaxY.value = withSequence(
            withTiming(3, { duration: dur(80) }),
            withTiming(-8, { duration: dur(140) }),
            withTiming(6, { duration: dur(60) }),
            withSpring(0, { mass: 0.6, stiffness: 220, damping: 12 })
        );
        artParallaxX.value = withSequence(
            withTiming(-2, { duration: dur(80) }),
            withTiming(6, { duration: dur(140) }),
            withSpring(0, { mass: 0.6, stiffness: 220, damping: 12 })
        );

        // Specular Glare Sweep
        specularProgress.value = withSequence(
            withTiming(-1.2, { duration: dur(60) }),
            withTiming(1.8, { duration: dur(260), easing: Easing.bezier(0.2, 0.8, 0.4, 1.0) })
        );

        // Stat Badges Trailing Inertia
        badgeLagY.value = withSequence(
            withDelay(dur(15), withTiming(2, { duration: dur(65) })),
            withTiming(-6, { duration: dur(140) }),
            withTiming(5, { duration: dur(60) }),
            withSpring(0, { mass: 0.3, stiffness: 350, damping: 10 })
        );

        badgeScaleX.value = withSequence(
            withDelay(dur(270), withTiming(1.2, { duration: dur(50) })),
            withSpring(1.0, { mass: 0.4, stiffness: 320, damping: 12 })
        );
        badgeScaleY.value = withSequence(
            withDelay(dur(270), withTiming(0.8, { duration: dur(50) })),
            withSpring(1.0, { mass: 0.4, stiffness: 320, damping: 12 })
        );

        // Rune Ignition Bloom
        runeGlow.value = withSequence(
            withDelay(dur(220), withTiming(0.8, { duration: dur(60) })),
            withTiming(1.0, { duration: dur(40) }),
            withTiming(0.35, { duration: dur(300) })
        );

        // Phase updates during flight
        const t1 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Phase 2: Arcane Ascendancy (Flight Arc)');
        }, dur(80));

        const t2 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Phase 3: Apex Snap & Plunge');
        }, dur(220));

        // PHASE 4: Impact Shockwave & Camera Shake at T = 280ms
        const t3 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Phase 4: IMPACT & Kinetic Slam!');
            runOnJS(triggerHaptic)(currentTier);

            shockwaveScale.value = 0.8;
            shockwaveOpacity.value = 0.9;
            shockwaveScale.value = withTiming(1.7, {
                duration: dur(240),
                easing: Easing.bezier(0, 0.7, 0.3, 1),
            });
            shockwaveOpacity.value = withTiming(0, {
                duration: dur(240),
                easing: Easing.bezier(0.4, 0, 1, 1),
            });

            // Screen micro-shake
            if (shakeMult > 0) {
                screenShakeY.value = withSequence(
                    withTiming(2.5 * shakeMult, { duration: dur(20) }),
                    withTiming(-2.0 * shakeMult, { duration: dur(20) }),
                    withTiming(1.0 * shakeMult, { duration: dur(20) }),
                    withTiming(0, { duration: dur(20) })
                );
            }
        }, dur(280));

        // Phase 5: Rebound
        const t4 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Phase 5: Elastic Rebound (Overshoot)');
        }, dur(320));

        // Settling complete
        const t5 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Phase 6: Rune Settled (Idle on Board)');
        }, dur(440));

        timeoutsRef.current = [t1, t2, t3, t4, t5];
    };

    const playAttackAnimation = () => {
        if (isPlayed) return;
        setIsPlayed(true);
        clearActiveTimeouts();

        const timeScale = slowMo ? 3.0 : 1.0;
        const dur = (ms: number) => ms * timeScale;
        const currentTier = rarity;
        const shakeMult = RARITY_CONFIGS[currentTier].shakeMultiplier;

        // Phase 1: Strike Anticipation Coil
        runOnJS(updatePhaseLabel)('Attack Phase 1: Strike Coil (Anticipation)');

        translateY.value = withSequence(
            withTiming(16, { duration: dur(70), easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            withTiming(-130, { duration: dur(110), easing: Easing.bezier(0.12, 0.8, 0.32, 1) }),
            withSpring(0, { mass: 0.8, stiffness: 220, damping: 14 })
        );

        scaleX.value = withSequence(
            withTiming(0.93, { duration: dur(70) }),
            withTiming(1.18, { duration: dur(110) }),
            withSpring(1.0, { mass: 0.7, stiffness: 220, damping: 13 })
        );

        scaleY.value = withSequence(
            withTiming(0.93, { duration: dur(70) }),
            withTiming(1.22, { duration: dur(110) }),
            withSpring(1.0, { mass: 0.7, stiffness: 220, damping: 13 })
        );

        rotateX.value = withSequence(
            withTiming(-16, { duration: dur(110) }),
            withSpring(0, { mass: 0.6, stiffness: 200, damping: 12 })
        );

        rotateZ.value = withSequence(
            withTiming(-4, { duration: dur(70) }),
            withTiming(3, { duration: dur(110) }),
            withSpring(0, { mass: 0.5, stiffness: 260, damping: 14 })
        );

        // Impact at T = 180ms
        const t1 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Attack Phase 2: IMPACT Collision!');
            runOnJS(triggerHaptic)(currentTier);

            shockwaveScale.value = 0.8;
            shockwaveOpacity.value = 0.9;
            shockwaveScale.value = withTiming(1.6, {
                duration: dur(200),
                easing: Easing.bezier(0, 0.7, 0.3, 1),
            });
            shockwaveOpacity.value = withTiming(0, {
                duration: dur(200),
                easing: Easing.bezier(0.4, 0, 1, 1),
            });

            if (shakeMult > 0) {
                screenShakeY.value = withSequence(
                    withTiming(3.5 * shakeMult, { duration: dur(20) }),
                    withTiming(-3.0 * shakeMult, { duration: dur(20) }),
                    withTiming(1.5 * shakeMult, { duration: dur(20) }),
                    withTiming(0, { duration: dur(20) })
                );
            }
        }, dur(180));

        const t2 = setTimeout(() => {
            runOnJS(updatePhaseLabel)('Attack Phase 3: Recoil & Settle');
        }, dur(240));

        const t3 = setTimeout(() => {
            setIsPlayed(false);
            runOnJS(updatePhaseLabel)('Idle / Combat Ready');
        }, dur(480));

        timeoutsRef.current = [t1, t2, t3];
    };

    const resetCard = () => {
        clearActiveTimeouts();
        setIsPlayed(false);
        setActivePhase('Idle in Hand');

        translateX.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(0, { duration: 180 });
        scaleX.value = withTiming(1, { duration: 180 });
        scaleY.value = withTiming(1, { duration: 180 });
        rotateX.value = withTiming(0, { duration: 180 });
        rotateY.value = withTiming(0, { duration: 180 });
        rotateZ.value = withTiming(0, { duration: 180 });

        shadowOffsetY.value = withTiming(6, { duration: 180 });
        shadowRadius.value = withTiming(10, { duration: 180 });
        shadowOpacity.value = withTiming(0.45, { duration: 180 });
        shadowScale.value = withTiming(1, { duration: 180 });

        artParallaxX.value = withTiming(0, { duration: 180 });
        artParallaxY.value = withTiming(0, { duration: 180 });
        badgeLagY.value = withTiming(0, { duration: 180 });
        badgeScaleX.value = withTiming(1, { duration: 180 });
        badgeScaleY.value = withTiming(1, { duration: 180 });
        specularProgress.value = -1.2;
        runeGlow.value = withTiming(0.2, { duration: 180 });

        shockwaveOpacity.value = 0;
        screenShakeY.value = 0;
    };

    // --- Animated Styles ---
    const screenShakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: screenShakeY.value }],
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { perspective: 850 },
            { rotateX: `${rotateX.value}deg` },
            { rotateY: `${rotateY.value}deg` },
            { rotateZ: `${rotateZ.value}deg` },
            { scaleX: scaleX.value },
            { scaleY: scaleY.value },
        ],
    }));

    const shadowAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value + shadowOffsetY.value },
            { scaleX: shadowScale.value },
            { scaleY: shadowScale.value },
        ],
        shadowOffset: { width: 0, height: shadowOffsetY.value },
        shadowRadius: shadowRadius.value,
        shadowOpacity: shadowOpacity.value,
        elevation: shadowOffsetY.value / 2,
    }));

    const artParallaxStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: artParallaxX.value },
            { translateY: artParallaxY.value },
            { scale: 1.14 },
        ],
    }));

    const specularStyle = useAnimatedStyle(() => {
        const leftPos = interpolate(specularProgress.value, [-1.2, 1.8], [-cardWidth * 1.5, cardWidth * 1.5]);
        return {
            transform: [{ translateX: leftPos }, { rotate: '25deg' }],
        };
    });

    const badgeLagStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: badgeLagY.value },
            { scaleX: badgeScaleX.value },
            { scaleY: badgeScaleY.value },
        ],
    }));

    const runeGlowStyle = useAnimatedStyle(() => ({
        opacity: runeGlow.value,
    }));

    const shockwaveStyle = useAnimatedStyle(() => ({
        opacity: shockwaveOpacity.value,
        transform: [
            { translateX: targetTranslateX },
            { translateY: targetTranslateY },
            { scale: shockwaveScale.value },
        ],
    }));

    return (
        <View style={styles.safeContainer}>
            <StatusBar barStyle="light-content" />

            {/* Ambient Background Gradient */}
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void, '#010409']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.mainContainer, screenShakeStyle]}>
                {/* Top Nav Bar */}
                <View style={[styles.topBar, { top: insets.top + 8 }]}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>← BACK</Text>
                    </Pressable>

                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>✧ ARCANE SLAM LAB ✧</Text>
                        <Text style={styles.phaseIndicator}>{activePhase}</Text>
                    </View>

                    <View style={{ width: 60 }} />
                </View>

                {/* Rarity Selector Pills */}
                <View style={[styles.tierBar, { top: insets.top + 68 }]}>
                    {(['common', 'epic', 'legendary'] as RarityTier[]).map((tier) => (
                        <Pressable
                            key={tier}
                            onPress={() => {
                                setRarity(tier);
                                resetCard();
                            }}
                            style={[
                                styles.tierPill,
                                rarity === tier && styles.tierPillActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tierPillText,
                                    rarity === tier && styles.tierPillTextActive,
                                ]}
                            >
                                {RARITY_CONFIGS[tier].label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Battlefield Target Indicator Slot */}
                <View
                    style={[
                        styles.targetSlot,
                        {
                            width: cardWidth + 8,
                            height: cardHeight + 8,
                            transform: [{ translateX: targetTranslateX }, { translateY: targetTranslateY }],
                        },
                    ]}
                >
                    <Text style={styles.slotText}>BATTLEFIELD SLOT</Text>
                    <View style={styles.targetCornerTL} />
                    <View style={styles.targetCornerTR} />
                    <View style={styles.targetCornerBL} />
                    <View style={styles.targetCornerBR} />
                </View>

                {/* Impact Shockwave Ring */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.shockwaveRing,
                        {
                            width: cardWidth * 1.6,
                            height: cardHeight * 1.3,
                            borderColor: config.glowColor,
                            backgroundColor: config.shockwaveColor,
                        },
                        shockwaveStyle,
                    ]}
                />

                {/* Dynamic Cast Shadow (Layers 0 & 1) */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.dynamicShadow,
                        { width: cardWidth, height: cardHeight },
                        shadowAnimatedStyle,
                    ]}
                />

                {/* Card Chassis (Root) */}
                <Animated.View
                    style={[
                        styles.cardChassis,
                        { width: cardWidth, height: cardHeight },
                        cardAnimatedStyle,
                    ]}
                >
                    {/* Obsidian Outer Frame */}
                    <LinearGradient
                        colors={config.borderColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardBorder}
                    >
                        {/* Inner Bezel */}
                        <View style={styles.cardBezel}>
                            {/* Artwork Container (Clipped for Parallax) */}
                            <View style={styles.artViewport}>
                                <Animated.View style={[styles.artContent, artParallaxStyle]}>
                                    <LinearGradient
                                        colors={['#1e1b4b', '#0f172a', '#020617']}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    {/* Central Creature Sigil */}
                                    <View style={styles.creatureAura}>
                                        <Text style={[styles.creatureGlyph, { color: config.glowColor }]}>
                                            {config.glyph}
                                        </Text>
                                        <Text style={styles.cardNameText}>{config.name}</Text>
                                    </View>
                                </Animated.View>
                            </View>

                            {/* Specular Shimmer Layer */}
                            <View pointerEvents="none" style={styles.specularContainer}>
                                <Animated.View style={[styles.specularGlint, specularStyle]}>
                                    <LinearGradient
                                        colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </Animated.View>
                            </View>

                            {/* Rune Glow Overlay */}
                            <Animated.View
                                pointerEvents="none"
                                style={[styles.runeBloomOverlay, runeGlowStyle]}
                            >
                                <View style={[styles.runeBorderHighlight, { borderColor: config.glowColor }]} />
                            </Animated.View>

                            {/* Decoupled Stat Badges Container (Layer 6) */}
                            <Animated.View pointerEvents="none" style={[styles.badgesContainer, badgeLagStyle]}>
                                {/* Mana Cost Badge */}
                                <View style={[styles.badge, styles.manaBadge]}>
                                    <Text style={styles.badgeText}>{config.cost}</Text>
                                </View>

                                {/* Attack Badge */}
                                <View style={[styles.badge, styles.attackBadge]}>
                                    <Text style={styles.badgeText}>{config.atk}</Text>
                                </View>

                                {/* Health Badge */}
                                <View style={[styles.badge, styles.healthBadge]}>
                                    <Text style={styles.badgeText}>{config.hp}</Text>
                                </View>
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Interactive Controls Panel */}
                <View style={[styles.controlsPanel, { bottom: insets.bottom + 20 }]}>
                    <Pressable
                        onPress={playArcaneSlam}
                        disabled={isPlayed}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.playButton,
                            isPlayed && styles.buttonDisabled,
                            pressed && styles.buttonPressed,
                        ]}
                    >
                        <Text style={styles.buttonText}>SLAM CARD</Text>
                    </Pressable>

                    <Pressable
                        onPress={playAttackAnimation}
                        disabled={isPlayed}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.attackButton,
                            isPlayed && styles.buttonDisabled,
                            pressed && styles.buttonPressed,
                        ]}
                    >
                        <Text style={styles.buttonText}>⚔️ ATTACK</Text>
                    </Pressable>

                    <Pressable
                        onPress={resetCard}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.resetButton,
                            pressed && styles.buttonPressed,
                        ]}
                    >
                        <Text style={styles.buttonText}>RESET</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setSlowMo((prev) => !prev)}
                        style={[
                            styles.actionButton,
                            styles.toggleButton,
                            slowMo && styles.toggleActive,
                        ]}
                    >
                        <Text style={styles.toggleText}>{slowMo ? '0.33x SLOW' : '1.0x NORMAL'}</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    mainContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
    },
    backButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.3)',
    },
    backButtonText: {
        color: colors.arcane.emerald,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    headerInfo: {
        alignItems: 'center',
    },
    title: {
        color: colors.arcane.white,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 2,
        fontFamily: typography.fonts.heading,
        textShadowColor: colors.arcane.emerald,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    phaseIndicator: {
        color: colors.arcane.emeraldLight,
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    tierBar: {
        position: 'absolute',
        flexDirection: 'row',
        gap: 8,
        zIndex: 40,
    },
    tierPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.5)',
    },
    tierPillActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: colors.arcane.emerald,
    },
    tierPillText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    tierPillTextActive: {
        color: colors.arcane.emeraldLight,
    },
    targetSlot: {
        position: 'absolute',
        borderWidth: 1.5,
        borderColor: 'rgba(16, 185, 129, 0.25)',
        borderStyle: 'dashed',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.03)',
    },
    slotText: {
        color: 'rgba(16, 185, 129, 0.35)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    targetCornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 8,
        height: 8,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: colors.arcane.emerald,
    },
    targetCornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: colors.arcane.emerald,
    },
    targetCornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 8,
        height: 8,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderColor: colors.arcane.emerald,
    },
    targetCornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 8,
        height: 8,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: colors.arcane.emerald,
    },
    shockwaveRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2.5,
    },
    dynamicShadow: {
        position: 'absolute',
        backgroundColor: '#000000',
        borderRadius: 12,
        shadowColor: '#000',
    },
    cardChassis: {
        position: 'absolute',
        borderRadius: 12,
    },
    cardBorder: {
        flex: 1,
        borderRadius: 12,
        padding: 2.5,
    },
    cardBezel: {
        flex: 1,
        backgroundColor: '#090d14',
        borderRadius: 9.5,
        overflow: 'hidden',
    },
    artViewport: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    artContent: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatureAura: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatureGlyph: {
        fontSize: 52,
        textShadowColor: 'rgba(52, 211, 153, 0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
    },
    cardNameText: {
        color: '#e2e8f0',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.8,
        marginTop: 8,
    },
    specularContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    specularGlint: {
        width: 70,
        height: '250%',
        top: '-75%',
    },
    runeBloomOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    runeBorderHighlight: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderRadius: 9.5,
    },
    badgesContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    badge: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        shadowOpacity: 0.5,
        elevation: 4,
    },
    manaBadge: {
        top: 6,
        left: 6,
        backgroundColor: '#2563eb',
    },
    attackBadge: {
        bottom: 6,
        left: 6,
        backgroundColor: '#dc2626',
    },
    healthBadge: {
        bottom: 6,
        right: 6,
        backgroundColor: '#16a34a',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },
    controlsPanel: {
        position: 'absolute',
        flexDirection: 'row',
        gap: 12,
        zIndex: 50,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        backgroundColor: '#059669',
    },
    attackButton: {
        backgroundColor: '#b45309',
    },
    resetButton: {
        backgroundColor: '#334155',
    },
    toggleButton: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#475569',
    },
    toggleActive: {
        borderColor: colors.arcane.emerald,
        backgroundColor: '#064e3b',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonPressed: {
        transform: [{ scale: 0.95 }],
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    toggleText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '700',
    },
});
