import React from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Switch,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
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
    Easing,
} from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useSettingsStore } from '../../store';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
    navigation: SettingsScreenNavigationProp;
}

// ─── Background ──────────────────────────────────────────────────────────────
const ScreenBackground: React.FC = () => (
    <View style={StyleSheet.absoluteFill}>
        <LinearGradient
            colors={[colors.arcane.obsidian, colors.arcane.void, colors.arcane.obsidian]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.bgLineH} />
        <View style={styles.bgLineV} />
    </View>
);

// ─── Pulsing corner rune ──────────────────────────────────────────────────────
const CornerRune: React.FC<{ pos: object }> = ({ pos }) => {
    const glow = useSharedValue(0.15);
    React.useEffect(() => {
        glow.value = withRepeat(
            withTiming(0.7, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: glow.value }));
    return (
        <Animated.View style={[styles.cornerRune, pos, style]}>
            <View style={styles.cornerRuneInner} />
        </Animated.View>
    );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({
    title, children, delay = 0
}) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.section}>
        {/* Corner runes */}
        <CornerRune pos={{ top: 6, left: 6 }} />
        <CornerRune pos={{ top: 6, right: 6 }} />
        <CornerRune pos={{ bottom: 6, left: 6 }} />
        <CornerRune pos={{ bottom: 6, right: 6 }} />

        <LinearGradient
            colors={['rgba(16,185,129,0.04)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFill}
        />

        {/* Section label */}
        <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLine} />
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionTitleLine} />
        </View>

        {children}
    </Animated.View>
);

// ─── Toggle row ───────────────────────────────────────────────────────────────
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const {
        soundEnabled, musicEnabled, hapticsEnabled, animationSpeed, language,
        toggleSound, toggleMusic, toggleHaptics, setAnimationSpeed, setLanguage,
    } = useSettingsStore();

    return (
        <BoardSurface style={styles.container}>
            <ScreenBackground />

            {/* ── HEADER ── */}
            <Animated.View
                entering={FadeIn.duration(600)}
                style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: 20 }]}
            >
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
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

                {/* Right spacer to balance the back button */}
                <View style={{ width: 72 }} />
            </Animated.View>

            {/* ── CONTENT ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom: insets.bottom + 20,
                        paddingHorizontal: 16,
                        flexDirection: isLandscape ? 'row' : 'column',
                        alignItems: isLandscape ? 'flex-start' : 'center',
                        gap: 12,
                    }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* SENSORY */}
                <View style={isLandscape ? styles.columnHalf : styles.columnFull}>
                    <Section title={t('settings.sensory.title')} delay={150}>
                        <ToggleRow
                            icon="🔊"
                            label={t('settings.sensory.sound_effects')}
                            sublabel={t('settings.sensory.sound_sub')}
                            value={soundEnabled}
                            onValueChange={toggleSound}
                        />
                        <View style={styles.rowDivider} />
                        <ToggleRow
                            icon="🎵"
                            label={t('settings.sensory.music')}
                            sublabel={t('settings.sensory.music_sub')}
                            value={musicEnabled}
                            onValueChange={toggleMusic}
                        />
                        <View style={styles.rowDivider} />
                        <ToggleRow
                            icon="📳"
                            label={t('settings.sensory.haptics')}
                            sublabel={t('settings.sensory.haptics_sub')}
                            value={hapticsEnabled}
                            onValueChange={toggleHaptics}
                        />
                    </Section>
                </View>

                {/* VISUALS */}
                <View style={isLandscape ? styles.columnHalf : styles.columnFull}>
                    <Section title={t('settings.visuals.title')} delay={280}>
                        <Text style={styles.speedLabel}>{t('settings.visuals.animation_speed')}</Text>
                        <View style={styles.speedRow}>
                            {(['slow', 'normal', 'fast'] as const).map((speed) => {
                                const isActive = animationSpeed === speed;
                                return (
                                    <Pressable
                                        key={speed}
                                        onPress={() => setAnimationSpeed(speed)}
                                        style={[styles.speedBtn, isActive && styles.speedBtnActive]}
                                    >
                                        <LinearGradient
                                            colors={isActive
                                                ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                                                : ['rgba(16,185,129,0.04)', 'rgba(0,0,0,0)']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={[styles.speedBtnText, isActive && styles.speedBtnTextActive]}>
                                            {t(`settings.visuals.speeds.${speed}`)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Section>
                </View>

                {/* LANGUAGE */}
                <View style={isLandscape ? styles.columnHalf : styles.columnFull}>
                    <Section title={t('settings.language.title')} delay={400}>
                        <Text style={styles.speedLabel}>{t('settings.language.select').toUpperCase()}</Text>
                        <View style={styles.speedRow}>
                            {(['en', 'tr'] as const).map((lang) => {
                                const isActive = i18n.language.startsWith(lang);
                                return (
                                    <Pressable
                                        key={lang}
                                        onPress={() => {
                                            setLanguage(lang);
                                            i18n.changeLanguage(lang);
                                        }}
                                        style={[styles.speedBtn, isActive && styles.speedBtnActive]}
                                    >
                                        <LinearGradient
                                            colors={isActive
                                                ? [colors.arcane.emerald, colors.arcane.emeraldDark]
                                                : ['rgba(16,185,129,0.04)', 'rgba(0,0,0,0)']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={[styles.speedBtnText, isActive && styles.speedBtnTextActive]}>
                                            {t(`settings.language.${lang}`)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Section>
                </View>
                {/* OTHER */}
                <View style={isLandscape ? styles.columnHalf : styles.columnFull}>
                    <Section title={t('settings.other.title', 'OTHER')} delay={500}>
                        <Pressable 
                            style={styles.replayButton}
                            onPress={() => {
                                const reset = useSettingsStore.getState().resetTutorial;
                                reset();
                                navigation.navigate('Tutorial');
                            }}
                        >
                            <LinearGradient
                                colors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.02)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.replayButtonText}>
                                {t('settings.other.replay_tutorial', '📖 How to Play')}
                            </Text>
                        </Pressable>
                    </Section>
                </View>
            </ScrollView>

            {/* ── FOOTER ── */}
            <Animated.View
                entering={FadeIn.delay(500).duration(600)}
                style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}
            >
                <Text style={styles.footerText}>{t('settings.footer')}</Text>
                <Text style={styles.footerVersion}>{t('settings.version')}</Text>
            </Animated.View>
        </BoardSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },

    // Background
    bgLineH: {
        position: 'absolute', top: '35%', left: 0, right: 0,
        height: 1, backgroundColor: colors.arcane.emerald, opacity: 0.04,
    },
    bgLineV: {
        position: 'absolute', top: 0, bottom: 0, left: '50%',
        width: 1, backgroundColor: colors.arcane.emerald, opacity: 0.03,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.08)',
    },
    backBtn: {
        width: 72,
    },
    backBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        borderRadius: 2,
        gap: 4,
        backgroundColor: 'rgba(16,185,129,0.04)',
    },
    backArrow: {
        fontSize: 18,
        color: colors.arcane.emerald,
        lineHeight: 18,
        fontWeight: '300',
    },
    backText: {
        fontSize: 10,
        color: colors.arcane.emerald,
        fontWeight: '700',
        letterSpacing: 1.5,
        fontFamily: 'serif',
    },
    titleBlock: {
        alignItems: 'center',
    },
    titleEyebrow: {
        fontSize: 9,
        color: colors.arcane.emerald,
        letterSpacing: 5,
        opacity: 0.6,
        fontWeight: '700',
        fontFamily: 'serif',
    },
    titleMain: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.arcane.white,
        letterSpacing: 8,
        fontFamily: 'serif',
        textShadowColor: colors.arcane.emerald,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    titleUnderline: {
        width: 60,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.35,
        marginTop: 3,
    },

    // Scroll
    scrollContent: {
        paddingTop: 16,
    },
    columnFull: { width: '100%', maxWidth: 480, alignSelf: 'center' },
    columnHalf: { flex: 1, minWidth: 240 },

    // Section
    section: {
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.12)',
        borderRadius: 2,
        padding: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.35)',
        overflow: 'hidden',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    sectionTitleLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.2,
    },
    sectionTitle: {
        fontSize: 9,
        color: colors.arcane.emerald,
        letterSpacing: 3,
        fontWeight: '900',
        fontFamily: 'serif',
        opacity: 0.85,
    },

    // Corner rune
    cornerRune: {
        position: 'absolute',
        width: 10,
        height: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cornerRuneInner: {
        width: 5,
        height: 5,
        backgroundColor: colors.arcane.emerald,
        transform: [{ rotate: '45deg' }],
    },

    // Toggle row
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 2,
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
    iconText: { fontSize: 15 },
    toggleInfo: { flex: 1 },
    toggleLabel: {
        fontSize: 12,
        color: colors.arcane.white,
        fontWeight: '700',
        letterSpacing: 0.5,
        fontFamily: 'serif',
    },
    toggleSublabel: {
        fontSize: 9,
        color: colors.text.disabled,
        marginTop: 1,
        letterSpacing: 0.3,
        opacity: 0.7,
    },
    rowDivider: {
        height: 1,
        backgroundColor: 'rgba(16,185,129,0.06)',
        marginVertical: 2,
    },

    // Speed
    speedLabel: {
        fontSize: 9,
        color: colors.text.disabled,
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 10,
        opacity: 0.6,
    },
    speedRow: {
        flexDirection: 'row',
        gap: 8,
    },
    speedBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.18)',
        overflow: 'hidden',
    },
    speedBtnActive: {
        borderColor: colors.arcane.emerald,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        shadowOpacity: 0.4,
        elevation: 4,
    },
    speedBtnText: {
        fontSize: 10,
        color: colors.arcane.emerald,
        fontWeight: '900',
        letterSpacing: 1.5,
        fontFamily: 'serif',
        opacity: 0.6,
    },
    speedBtnTextActive: {
        color: colors.arcane.obsidian,
        opacity: 1,
    },
    
    // Replay Button
    replayButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.18)',
        overflow: 'hidden',
    },
    replayButtonText: {
        fontSize: 12,
        color: colors.arcane.emerald,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: 'serif',
        opacity: 0.9,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(16,185,129,0.06)',
    },
    footerText: {
        fontSize: 9,
        color: colors.arcane.emerald,
        letterSpacing: 2,
        opacity: 0.3,
        fontFamily: 'serif',
    },
    footerVersion: {
        fontSize: 8,
        color: colors.text.disabled,
        opacity: 0.3,
        marginTop: 2,
        letterSpacing: 1,
    },
});
