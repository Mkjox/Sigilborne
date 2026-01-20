import React from 'react';
import { View, StyleSheet, Switch, ScrollView, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../store';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
    navigation: SettingsScreenNavigationProp;
}

interface SettingRowProps {
    label: string;
    value: boolean;
    onToggle: () => void;
    delay?: number;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, value, onToggle, delay = 0 }) => (
    <Animated.View
        entering={SlideInRight.delay(delay).springify()}
        style={styles.settingRow}
    >
        <Text variant="body">{label}</Text>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
            thumbColor={colors.text.primary}
        />
    </Animated.View>
);

interface SpeedButtonProps {
    title: string;
    isActive: boolean;
    onPress: () => void;
}

const SpeedButton: React.FC<SpeedButtonProps> = ({ title, isActive, onPress }) => (
    <Pressable onPress={onPress} style={styles.speedButtonWrapper}>
        <LinearGradient
            colors={isActive
                ? [colors.primary[400], colors.primary[600]]
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.speedButton,
                isActive && styles.speedButtonActive
            ]}
        >
            <Text
                variant="button"
                color={isActive ? colors.text.primary : colors.text.secondary}
            >
                {title}
            </Text>
        </LinearGradient>
    </Pressable>
);

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const {
        soundEnabled,
        musicEnabled,
        hapticsEnabled,
        animationSpeed,
        toggleSound,
        toggleMusic,
        toggleHaptics,
        setAnimationSpeed,
    } = useSettingsStore();

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative glow */}
            <Animated.View
                entering={FadeIn.delay(200).duration(1000)}
                style={styles.glowOrb}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: insets.top + spacing.md,
                        paddingBottom: insets.bottom + spacing.md,
                        paddingLeft: insets.left + spacing.lg,
                        paddingRight: insets.right + spacing.lg,
                    }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <Animated.View
                        entering={FadeIn.delay(100)}
                        style={styles.header}
                    >
                        <Pressable
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Text variant="body" color={colors.primary[400]}>← Back</Text>
                        </Pressable>
                        <Text variant="h3" style={styles.title}>Settings</Text>
                        <View style={styles.backButton} />
                    </Animated.View>

                    {/* Settings Card */}
                    <View style={styles.card}>
                        {/* Audio Section */}
                        <Animated.View
                            entering={FadeIn.delay(200)}
                            style={styles.section}
                        >
                            <Text variant="h4" color={colors.accent[400]} style={styles.sectionTitle}>
                                🔊 Audio
                            </Text>
                            <SettingRow
                                label="Sound Effects"
                                value={soundEnabled}
                                onToggle={toggleSound}
                                delay={100}
                            />
                            <SettingRow
                                label="Music"
                                value={musicEnabled}
                                onToggle={toggleMusic}
                                delay={150}
                            />
                        </Animated.View>

                        {/* Feedback Section */}
                        <Animated.View
                            entering={FadeIn.delay(300)}
                            style={styles.section}
                        >
                            <Text variant="h4" color={colors.accent[400]} style={styles.sectionTitle}>
                                📳 Feedback
                            </Text>
                            <SettingRow
                                label="Haptic Feedback"
                                value={hapticsEnabled}
                                onToggle={toggleHaptics}
                                delay={200}
                            />
                        </Animated.View>

                        {/* Animation Speed Section */}
                        <Animated.View
                            entering={FadeIn.delay(400)}
                            style={styles.section}
                        >
                            <Text variant="h4" color={colors.accent[400]} style={styles.sectionTitle}>
                                ⚡ Animation Speed
                            </Text>
                            <View style={styles.speedButtons}>
                                <SpeedButton
                                    title="SLOW"
                                    isActive={animationSpeed === 'slow'}
                                    onPress={() => setAnimationSpeed('slow')}
                                />
                                <SpeedButton
                                    title="NORMAL"
                                    isActive={animationSpeed === 'normal'}
                                    onPress={() => setAnimationSpeed('normal')}
                                />
                                <SpeedButton
                                    title="FAST"
                                    isActive={animationSpeed === 'fast'}
                                    onPress={() => setAnimationSpeed('fast')}
                                />
                            </View>
                        </Animated.View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    glowOrb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.primary[500],
        top: -150,
        right: -150,
        opacity: 0.2,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 60,
    },
    title: {
        textAlign: 'center',
        color: colors.text.primary,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    speedButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    speedButtonWrapper: {
        flex: 1,
    },
    speedButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    speedButtonActive: {
        borderColor: colors.primary[400],
    },
});
