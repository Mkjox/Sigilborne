import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
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
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const completeTutorial = useSettingsStore(state => state.completeTutorial);

    const SLIDES = [
        {
            id: '1',
            title: t('tutorial.slide1.title', 'Welcome to Sigilborne'),
            description: t('tutorial.slide1.desc', 'A roguelike deckbuilder where strategy and placement matter. Defeat the enemy hero to win.'),
            icon: '⚔️'
        },
        {
            id: '2',
            title: t('tutorial.slide2.title', 'The Resources'),
            description: t('tutorial.slide2.desc', 'Mana is required to play cards. You gain more Max Mana each turn. Gold is used in the shop.'),
            icon: '💎'
        },
        {
            id: '3',
            title: t('tutorial.slide3.title', 'Card Anatomy'),
            description: t('tutorial.slide3.desc', 'Top Left: Mana Cost. Bottom Left: Attack Power. Bottom Right: Health Points. Know your cards!'),
            icon: '🃏'
        },
        {
            id: '4',
            title: t('tutorial.slide4.title', 'Ready for Battle'),
            description: t('tutorial.slide4.desc', 'Drag units to the board. Attack enemy units or go straight for the enemy hero. Good luck!'),
            icon: '🔥'
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

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: Math.max(insets.top + spacing.xl, spacing.xl),
                        paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xl)
                    }
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
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

                    {/* Spacer to push footer down if card is tall, though it naturally flows */}
                    <View style={{ height: spacing.lg }} />

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

                    {/* Navigation Button */}
                    <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>
                            {currentIndex === SLIDES.length - 1 ? t('tutorial.btn.play', 'Got it! Let\'s Play') : t('tutorial.btn.next', 'Next')}
                        </Text>
                    </TouchableOpacity>

                    {/* Skip Button */}
                    <View style={styles.skipContainer}>
                        {currentIndex < SLIDES.length - 1 ? (
                            <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
                                <Text style={styles.skipText}>{t('tutorial.btn.skip', 'Skip')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.skipPlaceholder} />
                        )}
                    </View>

                </Animated.View>
            </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.background.secondary,
        borderRadius: 24,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.subtle,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        top: -45,
    },
    iconContainer: {
        marginBottom: spacing.sm,
        paddingTop: spacing.xs, // Prevents emoji clipping on Android
    },
    icon: {
        fontSize: 48,
        lineHeight: 56, // Explicit line height to prevent clipping
        textAlign: 'center',
    },
    title: {
        fontSize: typography.sizes.xl,
        fontFamily: typography.fonts.bold,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },

    description: {
        fontSize: typography.sizes.md,
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
    button: {
        width: '100%',
        backgroundColor: colors.arcane.emerald,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: colors.background.primary,
        fontFamily: typography.fonts.bold,
        fontSize: typography.sizes.md,
        letterSpacing: 1.5,
    },
    skipContainer: {
        height: 45,
        marginTop: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        padding: spacing.sm,
    },
    skipText: {
        color: colors.text.tertiary,
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.medium,
        textDecorationLine: 'underline',
    },
    skipPlaceholder: {
        height: 20,
    }
});
