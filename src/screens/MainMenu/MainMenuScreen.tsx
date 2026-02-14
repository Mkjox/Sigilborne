import React from 'react';
import {
    View,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withTiming,
    Easing,
    FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing } from '../../theme';

// Components
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { MenuPanel } from './components/MenuPanel';
import { MenuButton } from './components/MenuButton';

type MainMenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
    navigation: MainMenuScreenNavigationProp;
}

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const titleScale = useSharedValue(0.9);
    const titleGlow = useSharedValue(0.4);

    React.useEffect(() => {
        titleScale.value = withSpring(1);
        titleGlow.value = withRepeat(
            withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const titleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
        opacity: titleGlow.value,
    }));

    const bracketStyle = useAnimatedStyle(() => ({
        opacity: 0.15 + (titleGlow.value * 0.15),
        transform: [{ scale: 0.95 + (titleGlow.value * 0.1) }],
    }));

    const textGlowStyle = useAnimatedStyle(() => ({
        textShadowRadius: 20 * titleGlow.value,
    }));

    const handleEnterTavern = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('GameBoard', { difficulty: 'medium' });
    };

    return (
        <View style={styles.container}>
            <AtmosphericBackground />

            <View style={[
                styles.content,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
                isLandscape && styles.contentLandscape
            ]}>

                {/* 1. TITLE SECTION - Ritual Sigil Styling */}
                <Animated.View
                    entering={FadeIn.delay(300).duration(1000)}
                    style={[styles.header, isLandscape && styles.headerLandscape]}
                >
                    <View style={styles.titleContainer}>
                        {/* DECORATIVE ACCENTS */}
                        <Animated.View style={[styles.accentBracket, styles.bracketTopLeft, bracketStyle]} />
                        <Animated.View style={[styles.accentBracket, styles.bracketBottomRight, bracketStyle]} />

                        <Animated.View style={titleStyle}>
                            <Animated.Text style={[styles.title, textGlowStyle]}>
                                SIGILBORNE
                            </Animated.Text>
                        </Animated.View>
                        <View style={styles.titleUnderline} />
                    </View>

                    <Text style={styles.subtitle}>ARCANE CHRONICLES</Text>
                </Animated.View>

                {/* 2. MENU PANEL SECTION */}
                <Animated.View
                    entering={FadeIn.delay(600).duration(1000)}
                    style={[styles.menuContainer, isLandscape && styles.menuContainerLandscape]}
                >
                    <MenuPanel>
                        <MenuButton
                            title="Enter The Void"
                            onPress={handleEnterTavern}
                        />
                        <MenuButton
                            title="Collection"
                            onPress={() => navigation.navigate('Collection')}
                        />
                        <MenuButton
                            title="Deck Builder"
                            onPress={() => navigation.navigate('DeckBuilder')}
                        />
                        <MenuButton
                            title="Settings"
                            onPress={() => navigation.navigate('Settings')}
                        />
                    </MenuPanel>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>v0.5.0 - Arcane Beta</Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentLandscape: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl * 1.5,
    },
    headerLandscape: {
        marginBottom: 0,
        marginRight: spacing.xl,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 56, // Slightly larger
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 10, // More premium spacing
        fontFamily: 'serif',
        textShadowColor: colors.arcane.emerald,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    titleUnderline: {
        width: 140,
        height: 1, // Thinner, sharper
        backgroundColor: colors.arcane.emerald,
        marginTop: -6,
        opacity: 0.3,
    },
    accentBracket: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.arcane.emerald,
        opacity: 0.2,
    },
    bracketTopLeft: {
        top: -10,
        left: -20,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    bracketBottomRight: {
        bottom: 10,
        right: -20,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    subtitle: {
        fontSize: 14,
        color: colors.arcane.emerald,
        letterSpacing: 4,
        marginTop: spacing.sm,
        opacity: 0.8,
        fontWeight: '500',
    },
    menuContainer: {
        width: '100%',
        maxWidth: 340,
    },
    menuContainerLandscape: {
        maxWidth: 300,
    },
    footer: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 10,
        color: colors.arcane.emerald,
        opacity: 0.4,
        letterSpacing: 1,
    }
});
