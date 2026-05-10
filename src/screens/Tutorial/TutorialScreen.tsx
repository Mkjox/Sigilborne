import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { 
    FadeIn, 
    FadeInRight, 
    FadeOutLeft, 
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import * as Haptics from 'expo-haptics';
import { AnimatedLegendaryBorder } from './components/AnimatedLegendaryBorder';

type TutorialScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tutorial'>;

interface Props {
    navigation: TutorialScreenNavigationProp;
}

export const TutorialScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardLayout, setCardLayout] = useState<{ width: number; height: number } | null>(null);
    const completeTutorial = useSettingsStore(state => state.completeTutorial);

    const onCardLayout = (event: any) => {
        const { width, height } = event.nativeEvent.layout;
        setCardLayout({ width, height });
    };

    // Shimmer Animation Logic
    const shimmerProgress = useSharedValue(-1);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withTiming(1, { 
                duration: 4000, 
                easing: Easing.bezier(0.4, 0, 0.2, 1) 
            }),
            -1,
            false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{
            translateX: interpolate(shimmerProgress.value, [-1, 1], [-screenWidth, screenWidth])
        }],
        opacity: interpolate(shimmerProgress.value, [-1, -0.8, 0.8, 1], [0, 1, 1, 0])
    }));

    const SLIDES = [
        {
            id: '1',
            title: t('tutorial.slide1.title', 'The Journey Begins'),
            description: t('tutorial.slide1.desc', 'Welcome to Sigilborne, a world where strategy is your greatest weapon. Build your deck, place your units wisely, and defeat the enemy Hero to claim victory.'),
            icon: '📜'
        },
        {
            id: '2',
            title: t('tutorial.slide2.title', 'Mana & Wealth'),
            description: t('tutorial.slide2.desc', 'Mana powers your spells and summons. You gain more Max Mana each turn. Collect Gold during your run to buy powerful artifacts in the Shop.'),
            icon: '✨'
        },
        {
            id: '3',
            title: t('tutorial.slide3.title', 'Reading the Sigils'),
            description: t('tutorial.slide3.desc', 'Every card has three keys: Mana Cost (Top Left), Attack Power (Bottom Left), and Vitality (Bottom Right). Know your deck to master the board.'),
            icon: '🃏'
        },
        {
            id: '4',
            title: t('tutorial.slide4.title', 'Factions & Synergy'),
            description: t('tutorial.slide4.desc', 'Command the Arcane, Nature, and Neutral factions. Combining units from the same faction can unlock powerful synergies and hidden abilities.'),
            icon: '🌀'
        },
        {
            id: '5',
            title: t('tutorial.slide5.title', 'Tactical Combat'),
            description: t('tutorial.slide5.desc', 'Drag units to the battlefield. They attack enemies directly in front of them. Will you focus on their units, or strike the enemy Hero directly?'),
            icon: '⚔️'
        }
    ];

    const currentSlide = SLIDES[currentIndex];

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeTutorial();
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('MainMenu');
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View entering={FadeIn.duration(1000)} style={styles.backgroundOverlay} />

            <View style={styles.contentWrapper}>
                {/* Centered top spacer for landscape */}
                <View style={{ height: screenHeight * 0.12 }} />

                {/* STATIC CARD WRAPPER */}
                <View style={styles.cardContainer} onLayout={onCardLayout}>
                    {/* 1. Legendary Animated Border (Static, Back) */}
                    {cardLayout && (
                        <AnimatedLegendaryBorder 
                            width={cardLayout.width}
                            height={cardLayout.height}
                            borderRadius={24}
                            borderWidth={2}
                        />
                    )}

                    {/* 2. Glassmorphism Shimmer Overlay (Static, Back) */}
                    <View 
                        style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 24 }]}
                        pointerEvents="none"
                    >
                        <Animated.View style={[StyleSheet.absoluteFill, { width: '200%' }, shimmerStyle]}>
                            <LinearGradient
                                colors={[
                                    'transparent',
                                    'rgba(16, 185, 129, 0.02)',
                                    'rgba(16, 185, 129, 0.08)',
                                    'rgba(16, 185, 129, 0.02)',
                                    'transparent'
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    </View>

                    {/* 3. ANIMATED CONTENT BLOCK (Middle) */}
                    <Animated.View
                        key={currentIndex}
                        entering={FadeInRight.duration(400)}
                        exiting={FadeOutLeft.duration(300)}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="box-none"
                    >
                        <View style={styles.horizontalContent}>
                            {/* LEFT: ICON */}
                            <View style={styles.leftColumn}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>{currentSlide.icon}</Text>
                                </View>
                                
                                {/* Pagination */}
                                <Animated.View layout={LinearTransition} style={styles.pagination}>
                                    {SLIDES.map((_, i) => (
                                        <Animated.View
                                            key={i}
                                            layout={LinearTransition}
                                            style={[
                                                styles.dot,
                                                i === currentIndex ? styles.dotActive : styles.dotInactive
                                            ]}
                                        />
                                    ))}
                                </Animated.View>
                            </View>

                            {/* RIGHT: TEXT CONTENT */}
                            <View style={styles.rightColumn}>
                                <Text style={styles.title}>{currentSlide.title}</Text>
                                <Text style={styles.description}>{currentSlide.description}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* 4. STATIC NAVIGATION ELEMENTS (FRONT - Rendered last) */}
                    
                    {/* Skip / Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={handleComplete}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="close" size={24} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    {/* Left Chevron */}
                    {currentIndex > 0 && (
                        <View style={[styles.navContainer, styles.leftNav]} pointerEvents="box-none">
                            <TouchableOpacity 
                                style={styles.navChevron} 
                                onPress={handlePrev}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="chevron-back" size={24} color={colors.arcane.emerald} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Right Chevron */}
                    <View style={[styles.navContainer, styles.rightNav]} pointerEvents="box-none">
                        <TouchableOpacity 
                            style={styles.navChevron} 
                            onPress={handleNext}
                            activeOpacity={0.6}
                        >
                            <Ionicons 
                                name={currentIndex === SLIDES.length - 1 ? "play" : "chevron-forward"} 
                                size={currentIndex === SLIDES.length - 1 ? 20 : 24} 
                                color={colors.arcane.emerald} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 7, 12, 0.98)',
    },
    contentWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    cardContainer: {
        width: '92%',
        maxWidth: 720,
        minHeight: 280,
        backgroundColor: colors.arcane.graphite,
        borderRadius: 24,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        justifyContent: 'center',
        position: 'relative',
    },
    horizontalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing['2xl'],
        paddingHorizontal: spacing['2xl'],
        height: '100%',
    },
    leftColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    rightColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: spacing.xl,
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    icon: {
        fontSize: 72,
        lineHeight: 84,
        textAlign: 'center',
    },
    title: {
        fontSize: typography.sizes['2xl'],
        fontFamily: typography.fonts.heading,
        color: colors.text.primary,
        textAlign: 'left',
        marginBottom: spacing.sm,
        lineHeight: 32,
        paddingVertical: 2,
    },
    description: {
        fontSize: typography.sizes.base,
        color: colors.text.secondary,
        textAlign: 'left',
        lineHeight: 22,
    },
    pagination: {
        flexDirection: 'row',
        height: 8,
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    dotActive: {
        backgroundColor: colors.arcane.emerald,
        width: 18,
    },
    dotInactive: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        width: 6,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        zIndex: 30,
        padding: spacing.xs,
    },
    navContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 30,
        width: 60,
    },
    leftNav: {
        left: 0,
        alignItems: 'flex-start',
        paddingLeft: spacing.sm,
    },
    rightNav: {
        right: 0,
        alignItems: 'flex-end',
        paddingRight: spacing.sm,
    },
    navChevron: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 21,
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
