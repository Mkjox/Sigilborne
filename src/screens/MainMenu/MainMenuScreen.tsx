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
    withRepeat,
    withTiming,
    interpolateColor,
    Easing,
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
                return [colors.primary[500], colors.primary[700]];
            case 'accent':
                return [colors.accent[500], colors.accent[700]];
            case 'secondary':
            default:
                return ['rgba(139,69,19,0.5)', 'rgba(62,31,14,0.6)']; // Warm brown
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'primary':
                return colors.primary[300]; // Bright gold
            case 'accent':
                return colors.accent[400];
            case 'secondary':
            default:
                return colors.secondary[600]; // Brown border
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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const AnimatedBackground: React.FC = () => {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        // Animate through color states continuously
        progress.value = withRepeat(
            withTiming(1, {
                duration: 10000, // 10 seconds for full cycle
                easing: Easing.inOut(Easing.ease),
            }),
            -1, // Infinite repeat
            true // Reverse (ping-pong effect)
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        // Interpolate between warm brown color states
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 0.5, 1],
            [
                '#1A1410', // Very dark brown
                '#2D2520', // Dark brown with warm tone
                '#1A1410', // Back to very dark brown
            ]
        );

        return { backgroundColor };
    });

    return (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
            <LinearGradient
                colors={['rgba(212,175,55,0.05)', 'transparent', 'rgba(205,127,50,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
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
            {/* Animated background gradient */}
            <AnimatedBackground />

            {/* Decorative elements - Board game inspired */}
            <View style={styles.decorativeContainer}>
                {/* Corner ornaments */}
                <Animated.View
                    entering={FadeIn.delay(200).duration(1000)}
                    style={[styles.cornerOrnament, styles.cornerTopLeft]}
                />
                <Animated.View
                    entering={FadeIn.delay(300).duration(1000)}
                    style={[styles.cornerOrnament, styles.cornerTopRight]}
                />
                <Animated.View
                    entering={FadeIn.delay(400).duration(1000)}
                    style={[styles.cornerOrnament, styles.cornerBottomLeft]}
                />
                <Animated.View
                    entering={FadeIn.delay(500).duration(1000)}
                    style={[styles.cornerOrnament, styles.cornerBottomRight]}
                />

                {/* Subtle geometric pattern overlay */}
                <View style={styles.patternOverlay} />
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


                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <Text variant="h1" style={styles.title} color={colors.primary[400]}>
                                LEGENDS
                            </Text>
                            <Text variant="h3" style={styles.subtitle} color={colors.accent[400]}>
                                OF THE TAVERN
                            </Text>
                            <View style={styles.titleUnderline} />
                        </View>
                    </View>

                    {/* MENU ITEMS Container */}
                    <View style={styles.menuContainerOutside}>
                        <View style={styles.menuContainer}>
                            <MenuButton
                                title="PLAY"
                                subtitle="Start a new game"
                                onPress={() => navigation.navigate('GameBoard', { difficulty: 'medium' })}
                                variant="primary"
                                delay={100}
                            />

                            <MenuButton
                                title="COLLECTION"
                                subtitle="View your cards"
                                onPress={() => navigation.navigate('Collection')}
                                variant="secondary"
                                delay={200}
                            />

                            <MenuButton
                                title="DECK BUILDER"
                                subtitle="Create custom decks"
                                onPress={() => navigation.navigate('DeckBuilder')}
                                variant="secondary"
                                delay={300}
                            />

                            <MenuButton
                                title="SETTINGS"
                                subtitle="Game preferences"
                                onPress={() => navigation.navigate('Settings')}
                                variant="secondary"
                                delay={400}
                            />
                        </View>
                    </View>
                </Animated.View>
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
    cornerOrnament: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderColor: colors.accent[500], // Bronze
        borderWidth: 2.5,
        opacity: 0.35,
        shadowColor: colors.accent[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    cornerTopLeft: {
        top: spacing.xl,
        left: spacing.xl,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 8,
    },
    cornerTopRight: {
        top: spacing.xl,
        right: spacing.xl,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 8,
    },
    cornerBottomLeft: {
        bottom: spacing.xl,
        left: spacing.xl,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 8,
    },
    cornerBottomRight: {
        bottom: spacing.xl,
        right: spacing.xl,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 8,
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.02, // Even more subtle
        backgroundColor: 'transparent',
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

    header: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing['2xl'],
        zIndex: 10,
    },
    titleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    title: {
        fontSize: 64,
        fontWeight: '900',
        color: colors.primary[400],
        textAlign: 'center',
        letterSpacing: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 24,
        letterSpacing: 4,
        fontWeight: '300',
        marginTop: -10,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    titleUnderline: {
        width: 150,
        height: 3,
        backgroundColor: colors.primary[500],
        marginTop: 10,
        borderRadius: 2,
        shadowColor: colors.primary[500],
        shadowRadius: 10,
        shadowOpacity: 0.8,
    },
    menuContainerOutside: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    menuContainer: {
        width: '100%',
        gap: spacing.md,
        padding: spacing.sm,
        // Background/border handled by OrnateFrame now
    },
    menuButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 4,
        borderRadius: 24, // Pill shape
        borderWidth: 2,
        marginBottom: spacing.xs,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    menuButtonPrimary: {
        borderColor: colors.primary[400],
        shadowColor: colors.primary[500],
        shadowOpacity: 0.5,
        shadowRadius: 12,
        borderWidth: 2,
    },
    menuButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 2,
        textShadowOffset: { width: 1, height: 1 },
    },
    versionContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
