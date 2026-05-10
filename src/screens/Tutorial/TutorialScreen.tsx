import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import * as Haptics from 'expo-haptics';

type TutorialScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tutorial'>;

interface Props {
    navigation: TutorialScreenNavigationProp;
}

export const TutorialScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const completeTutorial = useSettingsStore(state => state.completeTutorial);

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
                {/* Top Spacer to position the card roughly 10% from the top */}
                <View style={{ height: screenHeight * 0.01 }} />

                <Animated.View
                    key={currentSlide.id}
                    entering={FadeInRight.duration(400)}
                    exiting={FadeOutLeft.duration(300)}
                    style={styles.cardContainer}
                >
                    {/* Header */}
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>{currentSlide.icon}</Text>
                    </View>
                    <Text style={styles.title}>{currentSlide.title}</Text>

                    {/* Body */}
                    <Text style={styles.description}>{currentSlide.description}</Text>

                    {/* Spacer */}
                    <View style={{ height: spacing.xl }} />

                    {/* Pagination Dots */}
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

                    {/* Button Row */}
                    <View style={styles.buttonRow}>
                        {currentIndex < SLIDES.length - 1 && (
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleComplete}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.skipText}>{t('tutorial.btn.skip', 'Skip')}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>
                                {currentIndex === SLIDES.length - 1
                                    ? t('tutorial.btn.play', "Let's Play")
                                    : t('tutorial.btn.next', 'Next')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
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
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.arcane.graphite,
        borderRadius: 24,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: spacing.sm,
        paddingTop: spacing.xs,
    },
    icon: {
        fontSize: 48,
        lineHeight: 56,
        textAlign: 'center',
    },
    title: {
        fontSize: typography.sizes.xl,
        fontFamily: typography.fonts.heading,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    description: {
        fontSize: typography.sizes.base,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: spacing.xl,
        height: 8,
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: colors.arcane.emerald,
        width: 24,
    },
    dotInactive: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        width: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        gap: spacing.md,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: colors.arcane.emerald,
        paddingVertical: spacing.md,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontFamily: typography.fonts.bodyBold,
        fontSize: typography.sizes.base,
        letterSpacing: 1,
    },
    skipButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: spacing.md,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    skipText: {
        color: colors.text.tertiary,
        fontSize: typography.sizes.base,
        fontFamily: typography.fonts.bodySemiBold,
    },
});
