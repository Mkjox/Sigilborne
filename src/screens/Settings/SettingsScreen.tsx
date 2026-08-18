import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Switch,
    LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { colors, typography } from '../../theme';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useSettingsStore } from '../../store';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
interface Props { navigation: SettingsScreenNavigationProp; }
type TabKey = 'sensory' | 'visuals' | 'language' | 'other';

// ─── Background ───────────────────────────────────────────────────────────────
const ScreenBackground: React.FC = () => (
    <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={[colors.arcane.obsidian, colors.arcane.void, colors.arcane.obsidian]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
        />
    </View>
);

// ─── Pulsing corner rune ──────────────────────────────────────────────────────
const CornerRune: React.FC<{ pos: object }> = ({ pos }) => {
    const glow = useSharedValue(0.15);
    React.useEffect(() => {
        glow.value = withRepeat(
            withTiming(0.7, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            -1, true,
        );
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: glow.value }));
    return (
        <Animated.View style={[styles.cornerRune, pos, style]}>
            <View style={styles.cornerRuneInner} />
        </Animated.View>
    );
};

// ─── Section ─────────────────────────────────────────────────────────────────
const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Animated.View entering={FadeInDown.delay(60).duration(340)} style={styles.section}>
        <CornerRune pos={{ top: 6, left: 6 }} />
        <CornerRune pos={{ top: 6, right: 6 }} />
        <CornerRune pos={{ bottom: 6, left: 6 }} />
        <CornerRune pos={{ bottom: 6, right: 6 }} />
        <LinearGradient
            colors={['rgba(16,185,129,0.04)', 'transparent']}
            style={StyleSheet.absoluteFill}
        />
        {children}
    </Animated.View>
);

// ─── Sliding Segmented Tabs ───────────────────────────────────────────────────
interface SegmentedTabsProps {
    tabs: { key: TabKey; label: string; icon: string }[];
    activeTab: TabKey;
    onTabPress: (key: TabKey) => void;
}

const SegmentedTabs: React.FC<SegmentedTabsProps> = ({ tabs, activeTab, onTabPress }) => {
    const [tabHeight, setTabHeight] = useState(0);
    const activeIndex = tabs.findIndex(t => t.key === activeTab);
    const pillY = useSharedValue(0);

    // Update pill position when active index changes
    React.useEffect(() => {
        if (tabHeight > 0) {
            pillY.value = withSpring(activeIndex * tabHeight, {
                damping: 20,
                stiffness: 180,
                mass: 0.8,
            });
        }
    }, [activeIndex, tabHeight]);

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: pillY.value + 3 }],
        height: tabHeight - 6,
    }));

    const handleContainerLayout = (e: LayoutChangeEvent) => {
        const h = e.nativeEvent.layout.height / tabs.length;
        setTabHeight(h);
        // Set initial position without animation
        pillY.value = activeIndex * h;
    };

    return (
        <View style={styles.segmentedContainer} onLayout={handleContainerLayout}>
            {/* Sliding pill */}
            {tabHeight > 0 && (
                <Animated.View style={[styles.segmentedPill, pillStyle]} pointerEvents="none">
                    <LinearGradient
                        colors={['rgba(16,185,129,0.20)', 'rgba(16,185,129,0.08)']}
                        locations={[0, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Pill border shimmer */}
                    <View style={styles.segmentedPillBorder} />
                </Animated.View>
            )}

            {/* Tab items */}
            {tabs.map((tab, idx) => {
                const isActive = tab.key === activeTab;
                return (
                    <Pressable
                        key={tab.key}
                        style={styles.segmentedTab}
                        onPress={() => onTabPress(tab.key)}
                    >
                        <Text style={[styles.segmentedIcon, isActive && styles.segmentedIconActive]}>
                            {tab.icon}
                        </Text>
                        <Text style={[styles.segmentedLabel, isActive && styles.segmentedLabelActive]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

// ─── Toggle Row ───────────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
    icon: string; label: string; sublabel: string;
    value: boolean; onValueChange: () => void;
}> = ({ icon, label, sublabel, value, onValueChange }) => (
    <Pressable onPress={onValueChange} style={styles.toggleRow}>
        <View style={[styles.iconBox, value && styles.iconBoxActive]}>
            <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Text style={styles.toggleSublabel}>{sublabel}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.arcane.emeraldDark }}
            thumbColor={value ? colors.arcane.emerald : colors.arcane.graphite}
            style={{ transform: [{ scale: 0.8 }] }}
        />
    </Pressable>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabKey>('sensory');

    const {
        soundEnabled, musicEnabled, hapticsEnabled, animationSpeed,
        toggleSound, toggleMusic, toggleHaptics, setAnimationSpeed, setLanguage,
    } = useSettingsStore();

    const handleToggleSound = useCallback(() => {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleSound();
    }, [hapticsEnabled, toggleSound]);

    const handleToggleMusic = useCallback(() => {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleMusic();
    }, [hapticsEnabled, toggleMusic]);

    const handleToggleHaptics = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleHaptics();
    }, [toggleHaptics]);

    const handleSetAnimationSpeed = useCallback((speed: 'slow' | 'normal' | 'fast') => {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAnimationSpeed(speed);
    }, [hapticsEnabled, setAnimationSpeed]);

    const handleSetLanguage = useCallback((lang: 'en' | 'tr' | 'es' | 'zh' | 'ja') => {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLanguage(lang);
        i18n.changeLanguage(lang);
    }, [hapticsEnabled, setLanguage]);

    const handleTabPress = useCallback((tab: TabKey) => {
        if (hapticsEnabled) Haptics.selectionAsync();
        setActiveTab(tab);
    }, [hapticsEnabled]);

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'sensory', label: t('settings.sensory.title'), icon: '🔊' },
        { key: 'visuals', label: t('settings.visuals.title'), icon: '✨' },
        { key: 'language', label: t('settings.language.title'), icon: '🌐' },
        { key: 'other', label: t('settings.other.title', 'OTHER'), icon: '⚙️' },
    ];

    return (
        <BoardSurface style={styles.container}>
            <ScreenBackground />

            {/* ── HEADER ── */}
            <Animated.View
                entering={FadeIn.duration(600)}
                style={[styles.header, { paddingTop: insets.top + 4, paddingHorizontal: 16 }]}
            >
                <Pressable
                    onPress={() => {
                        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.goBack();
                    }}
                    style={styles.backBtn}
                >
                    <View style={styles.backBtnInner}>
                        <Text style={styles.backArrow}>‹</Text>
                        <Text style={styles.backText}>{t('common.back')}</Text>
                    </View>
                </Pressable>

                <View style={styles.titleBlock}>
                    <Text style={styles.titleEyebrow}>ARCANE</Text>
                    <Text style={styles.titleMain}>{t('settings.title')}</Text>
                    <View style={styles.titleUnderline} />
                </View>

                <View style={{ width: 60 }} />
            </Animated.View>

            {/* ── MAIN SPLIT LAYOUT ── */}
            <View style={styles.mainLayout}>
                {/* ── SEGMENTED TABS (SIDEBAR) ── */}
                <Animated.View
                    entering={FadeIn.delay(160).duration(500)}
                    style={styles.tabsWrapper}
                >
                    <SegmentedTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabPress={handleTabPress}
                    />
                </Animated.View>

                {/* ── CONTENT ── */}
                <View style={styles.content}>
                    {activeTab === 'sensory' && (
                        <Section>
                            <ToggleRow
                                icon="🔊"
                                label={t('settings.sensory.sound_effects')}
                                sublabel={t('settings.sensory.sound_sub')}
                                value={soundEnabled}
                                onValueChange={handleToggleSound}
                            />
                            <View style={styles.rowDivider} />
                            <ToggleRow
                                icon="🎵"
                                label={t('settings.sensory.music')}
                                sublabel={t('settings.sensory.music_sub')}
                                value={musicEnabled}
                                onValueChange={handleToggleMusic}
                            />
                            <View style={styles.rowDivider} />
                            <ToggleRow
                                icon="📳"
                                label={t('settings.sensory.haptics')}
                                sublabel={t('settings.sensory.haptics_sub')}
                                value={hapticsEnabled}
                                onValueChange={handleToggleHaptics}
                            />
                        </Section>
                    )}

                    {activeTab === 'visuals' && (
                        <Section>
                            <Text style={styles.optionLabel}>{t('settings.visuals.animation_speed')}</Text>
                            <View style={styles.optionRow}>
                                {(['slow', 'normal', 'fast'] as const).map((speed) => {
                                    const isActive = animationSpeed === speed;
                                    return (
                                        <Pressable
                                            key={speed}
                                            onPress={() => handleSetAnimationSpeed(speed)}
                                            style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                                        >
                                            <LinearGradient
                                                colors={isActive
                                                    ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                                                    : ['rgba(16,185,129,0.04)', 'rgba(0,0,0,0)']}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <Text style={[styles.optionBtnText, isActive && styles.optionBtnTextActive]}>
                                                {t(`settings.visuals.speeds.${speed}`)}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </Section>
                    )}

                    {activeTab === 'language' && (
                        <Section>
                            <Text style={styles.optionLabel}>{t('settings.language.select').toUpperCase()}</Text>
                            <View style={styles.optionRow}>
                                {(['en', 'tr', 'es', 'zh', 'ja'] as const).map((lang) => {
                                    const isActive = i18n.language.startsWith(lang);
                                    
                                    const languageNames: Record<string, string> = {
                                        en: 'ENGLISH',
                                        tr: 'TÜRKÇE',
                                        es: 'ESPAÑOL',
                                        zh: '中文',
                                        ja: '日本語',
                                    };

                                    return (
                                        <Pressable
                                            key={lang}
                                            onPress={() => handleSetLanguage(lang)}
                                            style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                                        >
                                            <LinearGradient
                                                colors={isActive
                                                    ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                                                    : ['rgba(16,185,129,0.04)', 'rgba(0,0,0,0)']}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <Text style={[styles.optionBtnText, isActive && styles.optionBtnTextActive]}>
                                                {t(`settings.language.${lang}`, languageNames[lang])}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </Section>
                    )}

                    {activeTab === 'other' && (
                        <Section>
                            <Pressable
                                style={styles.replayButton}
                                onPress={() => {
                                    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    const reset = useSettingsStore.getState().resetTutorial;
                                    reset();
                                    navigation.navigate('Tutorial');
                                }}
                            >
                                <LinearGradient
                                    colors={['rgba(16,185,129,0.10)', 'rgba(16,185,129,0.02)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Text style={styles.replayButtonText}>
                                    {t('settings.other.replay_tutorial', '📖 How to Play')}
                                </Text>
                            </Pressable>
                        </Section>
                    )}
                </View>
            </View>

            {/* ── FOOTER ── */}
            <Animated.View
                entering={FadeIn.delay(500).duration(600)}
                style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}
            >
                {/* <Text style={styles.footerText}>{t('settings.footer')}</Text> */}
                <Text style={styles.footerVersion}>{t('settings.version')}</Text>
            </Animated.View>
        </BoardSurface>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.08)',
    },
    backBtn: { width: 60 },
    backBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        borderRadius: 2,
        gap: 3,
        backgroundColor: 'rgba(16,185,129,0.04)',
    },
    backArrow: {
        fontSize: 14,
        color: colors.arcane.emerald,
        lineHeight: 14,
        fontWeight: '300',
    },
    backText: {
        fontSize: 9,
        color: colors.arcane.emerald,
        fontWeight: '700',
        letterSpacing: 1.2,
        fontFamily: typography.fonts.heading,
    },
    titleBlock: { alignItems: 'center' },
    titleEyebrow: {
        fontSize: 7,
        color: colors.arcane.emerald,
        letterSpacing: 4,
        opacity: 0.6,
        fontWeight: '700',
        fontFamily: typography.fonts.heading,
    },
    titleMain: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 6,
        fontFamily: typography.fonts.heading,
        textShadowColor: colors.arcane.emerald,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    titleUnderline: {
        width: 40,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.35,
        marginTop: 2,
    },

    // Main Split Layout
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },

    // Segmented tabs (Sidebar)
    tabsWrapper: {
        width: 135,
        paddingLeft: 12,
        paddingRight: 4,
        paddingTop: 8,
        paddingBottom: 8,
    },
    segmentedContainer: {
        flexDirection: 'column',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.12)',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
    },
    segmentedPill: {
        position: 'absolute',
        left: 3,
        right: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    segmentedPillBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.40)',
    },
    segmentedTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        paddingLeft: 12,
        gap: 8,
        zIndex: 1,
    },
    segmentedIcon: {
        fontSize: 12,
        opacity: 0.4,
    },
    segmentedIconActive: {
        opacity: 1,
    },
    segmentedLabel: {
        fontSize: 9,
        color: colors.arcane.emerald,
        fontWeight: '700',
        letterSpacing: 0.8,
        fontFamily: typography.fonts.heading,
        opacity: 0.35,
        textTransform: 'uppercase',
    },
    segmentedLabelActive: {
        opacity: 1,
    },

    // Content
    content: {
        flex: 1,
        paddingLeft: 4,
        paddingRight: 12,
        paddingTop: 8,
        paddingBottom: 8,
    },

    // Section
    section: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.12)',
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
        overflow: 'hidden',
    },
    cornerRune: {
        position: 'absolute',
        width: 8,
        height: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cornerRuneInner: {
        width: 4,
        height: 4,
        backgroundColor: colors.arcane.emerald,
        transform: [{ rotate: '45deg' }],
    },

    // Toggle row
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: 'rgba(16,185,129,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxActive: {
        backgroundColor: 'rgba(16,185,129,0.15)',
        borderColor: 'rgba(16,185,129,0.4)',
    },
    iconText: { fontSize: 13 },
    toggleInfo: { flex: 1 },
    toggleLabel: {
        fontSize: 11,
        color: colors.arcane.white,
        fontWeight: '600',
        letterSpacing: 0.2,
        fontFamily: typography.fonts.heading,
    },
    toggleSublabel: {
        fontSize: 9,
        color: colors.text.disabled,
        opacity: 0.7,
    },
    rowDivider: {
        height: 1,
        backgroundColor: 'rgba(16,185,129,0.06)',
        marginVertical: 4,
    },

    // Option buttons (speed / language)
    optionLabel: {
        fontSize: 8,
        color: colors.text.disabled,
        letterSpacing: 1.5,
        fontWeight: '700',
        marginBottom: 6,
        opacity: 0.6,
        fontFamily: typography.fonts.heading,
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    optionBtn: {
        flexGrow: 1,
        minWidth: '30%',
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.18)',
        overflow: 'hidden',
    },
    optionBtnActive: {
        borderColor: colors.arcane.emerald,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 6,
        shadowOpacity: 0.3,
        elevation: 3,
    },
    optionBtnText: {
        fontSize: 9,
        color: colors.arcane.emerald,
        fontWeight: '800',
        letterSpacing: 1.2,
        fontFamily: typography.fonts.heading,
        opacity: 0.55,
    },
    optionBtnTextActive: {
        color: colors.arcane.obsidian,
        opacity: 1,
    },

    // Replay button
    replayButton: {
        width: '100%',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.18)',
        overflow: 'hidden',
    },
    replayButtonText: {
        fontSize: 11,
        color: colors.arcane.emerald,
        fontWeight: '800',
        letterSpacing: 1.2,
        fontFamily: typography.fonts.heading,
        opacity: 0.9,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(16,185,129,0.06)',
    },
    footerText: {
        fontSize: 8,
        color: colors.arcane.emerald,
        letterSpacing: 2,
        opacity: 0.3,
        fontFamily: typography.fonts.heading,
    },
    footerVersion: {
        fontSize: 7,
        color: colors.text.disabled,
        opacity: 0.3,
        letterSpacing: 1,
    },
});
