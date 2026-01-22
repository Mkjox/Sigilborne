import React from 'react';
import {
    View,
    StyleSheet,
    useWindowDimensions,
    Pressable,
    ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    withDelay,
    FadeIn,
    SlideInLeft,
    SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { useSettingsStore } from '../../store';

type MainMenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
    navigation: MainMenuScreenNavigationProp;
}

interface MenuButtonProps {
    title: string;
    subtitle?: string;
    icon?: string;
    variant: 'primary' | 'secondary' | 'accent';
    onPress: () => void;
    delay?: number;
}

const MenuButton: React.FC<MenuButtonProps> = ({
    title,
    subtitle,
    variant,
    onPress,
    delay = 0
}) => {
    const scale = useSharedValue(1);
    const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        switch (variant) {
            case 'primary':
                return [colors.primary[400], colors.primary[600]];
            case 'accent':
                return [colors.accent[400], colors.accent[600]];
            case 'secondary':
            default:
                return ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'];
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'primary':
                return colors.primary[400];
            case 'accent':
                return colors.accent[400];
            case 'secondary':
            default:
                return 'rgba(255,255,255,0.2)';
        }
    };

    return (
        <Animated.View
            entering={SlideInRight.delay(delay).springify()}
            style={animatedStyle}
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.menuButton,
                        { borderColor: getBorderColor() },
                        variant === 'primary' && styles.menuButtonPrimary,
                    ]}
                >
                    <Text
                        variant="button"
                        style={styles.menuButtonText}
                        color={variant === 'secondary' ? colors.text.secondary : colors.text.primary}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            variant="caption"
                            color={variant === 'secondary' ? colors.text.disabled : 'rgba(255,255,255,0.7)'}
                        >
                            {subtitle}
                        </Text>
                    )}
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
};

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Layout calculations
    const isLandscape = width > height;
    const contentPadding = Math.max(spacing.md, insets.left, insets.right);

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative elements */}
            <View style={styles.decorativeContainer}>
                <Animated.View
                    entering={FadeIn.delay(200).duration(1000)}
                    style={[styles.glowOrb, styles.glowOrbPrimary]}
                />
                <Animated.View
                    entering={FadeIn.delay(400).duration(1000)}
                    style={[styles.glowOrb, styles.glowOrbAccent]}
                />
            </View>

            {/* Main content - responsive layout */}
            <View style={[
                styles.content,
                isLandscape ? styles.contentLandscape : styles.contentPortrait,
                {
                    paddingLeft: contentPadding + insets.left,
                    paddingRight: contentPadding + insets.right,
                    paddingTop: insets.top + spacing.md,
                    paddingBottom: insets.bottom + spacing.md,
                }
            ]}>
                {/* Left side - Logo and title */}
                <Animated.View
                    entering={isLandscape ? SlideInLeft.springify() : FadeIn.duration(800)}
                    style={styles.brandSection}
                >
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[colors.primary[500], colors.accent[500]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoGradient}
                        >
                            <Text variant="h1" style={styles.logoText}>⚔</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.titleContainer}>
                        <Text variant="h2" style={styles.title}>
                            CARD
                        </Text>
                        <Text variant="h2" style={styles.titleAccent}>
                            LEGENDS
                        </Text>
                    </View>

                    <Text variant="caption" color={colors.text.disabled} style={styles.tagline}>
                        Strategic Card Battle
                    </Text>
                </Animated.View>

                {/* Divider - responsive */}
                <View style={isLandscape ? styles.dividerVertical : styles.dividerHorizontal} />

                {/* Right side - Menu buttons */}
                <View style={styles.menuSection}>
                    <MenuButton
                        title="PLAY"
                        subtitle="Battle the AI"
                        variant="primary"
                        delay={100}
                        onPress={() => navigation.navigate('GameBoard', { difficulty: 'medium' })}
                    />

                    <MenuButton
                        title="COLLECTION"
                        subtitle="View your cards"
                        variant="secondary"
                        delay={200}
                        onPress={() => navigation.navigate('Collection')}
                    />

                    <MenuButton
                        title="DECK BUILDER"
                        subtitle="Customize decks"
                        variant="secondary"
                        delay={300}
                        onPress={() => navigation.navigate('DeckBuilder')}
                    />

                    <MenuButton
                        title="SETTINGS"
                        variant="secondary"
                        delay={400}
                        onPress={() => navigation.navigate('Settings')}
                    />
                </View>
            </View>

            {/* Version info */}
            <Animated.View
                entering={FadeIn.delay(600)}
                style={[styles.versionContainer, { bottom: insets.bottom + spacing.sm }]}
            >
                <Text variant="caption" color={colors.text.disabled}>
                    v1.0.0
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    decorativeContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    glowOrb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.3,
    },
    glowOrbPrimary: {
        backgroundColor: colors.primary[500],
        top: -100,
        left: -100,
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 100,
    },
    glowOrbAccent: {
        backgroundColor: colors.accent[500],
        bottom: -100,
        right: -100,
        shadowColor: colors.accent[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 100,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
    },
    contentLandscape: {
        flexDirection: 'row',
    },
    contentPortrait: {
        flexDirection: 'column',
    },
    brandSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 280,
    },
    logoContainer: {
        marginBottom: spacing.md,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    logoText: {
        fontSize: 40,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        color: colors.text.primary,
        letterSpacing: 4,
        marginBottom: -8,
    },
    titleAccent: {
        color: colors.primary[400],
        letterSpacing: 6,
    },
    tagline: {
        marginTop: spacing.sm,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    dividerVertical: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerHorizontal: {
        width: '60%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    menuSection: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.sm,
        maxWidth: 280,
    },
    menuButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuButtonPrimary: {
        ...shadows.glow,
    },
    menuButtonText: {
        letterSpacing: 2,
    },
    versionContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
