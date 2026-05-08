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
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';
import { useFocusEffect } from '@react-navigation/native';
// Components
import { MainMenuSkiaBackground } from './components/MainMenuSkiaBackground';
import { MenuPanel } from './components/MenuPanel';
import { MenuButton } from './components/MenuButton';

type MainMenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
    navigation: MainMenuScreenNavigationProp;
}

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const isLandscape = width > height;

    // Scale title font relative to screen width so it never overflows
    const titleFontSize = Math.min(width * 0.11, 44);
    const titleLetterSpacing = Math.min(width * 0.018, 7);

    const titleScale = useSharedValue(0.9);
    const titleGlow = useSharedValue(0.4);
    const hasSeenTutorial = useSettingsStore(state => state.hasSeenTutorial);

    useFocusEffect(
        React.useCallback(() => {
            if (!hasSeenTutorial) {
                navigation.navigate('Tutorial');
            }
        }, [hasSeenTutorial, navigation])
    );

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

    const handleEnterVoid = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('CampaignMap');
    };

    return (
        <View style={styles.container}>
            <MainMenuSkiaBackground />

            <View style={[
                styles.content,
                { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
                isLandscape && styles.contentLandscape
            ]}>

                {/* TITLE SECTION */}
                <Animated.View
                    entering={FadeIn.delay(300).duration(1000)}
                    style={[styles.header, isLandscape && styles.headerLandscape]}
                >
                    <View style={styles.titleContainer}>
                        <Animated.View style={[styles.accentBracket, styles.bracketTopLeft, bracketStyle]} />
                        <Animated.View style={[styles.accentBracket, styles.bracketBottomRight, bracketStyle]} />

                        <Animated.View style={titleStyle}>
                            <Animated.Text style={[
                                styles.title,
                                { fontSize: titleFontSize, letterSpacing: titleLetterSpacing },
                                textGlowStyle
                            ]}>
                                SIGILBORNE
                            </Animated.Text>
                        </Animated.View>
                        <View style={styles.titleUnderline} />
                    </View>

                    <Text style={styles.subtitle}>{t('menu.subtitle')}</Text>
                </Animated.View>

                {/* MENU PANEL SECTION */}
                <Animated.View
                    entering={FadeIn.delay(600).duration(1000)}
                    style={[styles.menuContainer, isLandscape && styles.menuContainerLandscape]}
                >
                    <MenuPanel>
                        <MenuButton
                            title={t('menu.enter_void')}
                            onPress={handleEnterVoid}
                        />
                        <MenuButton
                            title={t('menu.collection')}
                            onPress={() => navigation.navigate('Collection')}
                        />
                        <MenuButton
                            title={t('menu.deck_builder')}
                            onPress={() => navigation.navigate('DeckBuilder')}
                        />
                        <MenuButton
                            title={t('menu.settings')}
                            onPress={() => navigation.navigate('Settings')}
                        />
                    </MenuPanel>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>v0.1.0 — Arcane Beta</Text>
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
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentLandscape: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerLandscape: {
        marginBottom: 0,
        marginRight: spacing.lg,
        justifyContent: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    title: {
        fontWeight: '900',
        color: colors.arcane.white,
        fontFamily: 'serif',
        textShadowColor: colors.arcane.emerald,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    titleUnderline: {
        width: 100,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        marginTop: -4,
        opacity: 0.3,
    },
    accentBracket: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderColor: colors.arcane.emerald,
        opacity: 0.2,
    },
    bracketTopLeft: {
        top: -8,
        left: -14,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    bracketBottomRight: {
        bottom: -28,
        right: -14,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    subtitle: {
        fontSize: 11,
        color: colors.arcane.emerald,
        letterSpacing: 4,
        marginTop: spacing.xs,
        opacity: 0.7,
        fontWeight: '500',
    },
    menuContainer: {
        width: '100%',
        maxWidth: 300,
    },
    menuContainerLandscape: {
        maxWidth: 300,
    },
    footer: {
        marginTop: spacing.sm,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 9,
        color: colors.arcane.emerald,
        opacity: 0.35,
        letterSpacing: 1,
    }
});
