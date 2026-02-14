import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Switch, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../store';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
    navigation: SettingsScreenNavigationProp;
}

const AnimatedBackground: React.FC = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void, colors.arcane.obsidian]}
                style={StyleSheet.absoluteFill}
            />
            {/* Subtle Void Energy Lines */}
            <View style={styles.voidEnergyLine} />
        </View>
    );
};

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const {
        soundEnabled,
        musicEnabled,
        hapticsEnabled,
        animationSpeed,
        toggleSound,
        toggleMusic,
        toggleHaptics,
        setAnimationSpeed
    } = useSettingsStore();

    const handleBack = () => navigation.goBack();

    const SettingRow = ({ label, value, onValueChange, icon }: { label: string, value: boolean, onValueChange: () => void, icon: string }) => (
        <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>{icon}</Text>
                <Text variant="bodySmall" color={colors.arcane.white} style={{ fontWeight: '700' }}>{label.toUpperCase()}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.arcane.graphite, true: colors.arcane.emeraldDark }}
                thumbColor={value ? colors.arcane.emerald : colors.text.disabled}
                style={{ transform: [{ scale: 0.85 }] }}
            />
        </View>
    );

    return (
        <BoardSurface style={styles.container}>
            <AnimatedBackground />

            <View style={[styles.content, {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                paddingHorizontal: 20
            }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Text variant="caption" color={colors.arcane.emerald} style={{ fontWeight: '900', letterSpacing: 1.5 }}>← RETREAT</Text>
                    </Pressable>
                    <Text variant="h3" style={styles.title}>CHAMBER OF ECHOES</Text>
                    <View style={{ width: 80 }} />
                </View>

                <ScrollView
                    style={{ width: '100%' }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeIn.delay(200)} style={styles.settingsPanel}>
                        <LinearGradient
                            colors={['rgba(11, 15, 20, 0.9)', 'rgba(31, 41, 55, 0.4)']}
                            style={StyleSheet.absoluteFill}
                        />

                        <Text variant="caption" color={colors.arcane.emerald} style={styles.sectionHeader}>SENSORY TUNING</Text>
                        <View style={styles.sectionDivider} />

                        <SettingRow icon="🔊" label="Audio Resonance" value={soundEnabled} onValueChange={toggleSound} />
                        <SettingRow icon="🎵" label="Void Melodies" value={musicEnabled} onValueChange={toggleMusic} />
                        <SettingRow icon="📳" label="Tactile Feedback" value={hapticsEnabled} onValueChange={toggleHaptics} />

                        <View style={{ height: 16 }} />
                        <Text variant="caption" color={colors.arcane.emerald} style={styles.sectionHeader}>TEMPORARY DYNAMICS</Text>
                        <View style={styles.sectionDivider} />

                        <View style={styles.speedSection}>
                            <Text variant="caption" color={colors.text.disabled} style={{ marginBottom: 12, fontSize: 10 }}>ANIMATION VELOCITY</Text>
                            <View style={styles.speedRow}>
                                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                                    <Pressable
                                        key={speed}
                                        onPress={() => setAnimationSpeed(speed)}
                                        style={[
                                            styles.speedBtn,
                                            animationSpeed === speed && styles.speedBtnActive
                                        ]}
                                    >
                                        <Text
                                            variant="caption"
                                            color={animationSpeed === speed ? colors.arcane.obsidian : colors.arcane.emerald}
                                            style={{ fontWeight: '900', fontSize: 10 }}
                                        >
                                            {speed.toUpperCase()}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Footer Info */}
                    <Animated.View entering={SlideInDown.delay(400)} style={styles.footer}>
                        <Text variant="caption" color={colors.text.disabled} style={{ opacity: 0.5, fontSize: 9 }}>ARCANE PROTOCOL v1.0.4</Text>
                        <Text variant="caption" color={colors.arcane.emerald} style={{ opacity: 0.3, marginTop: 2, fontSize: 8 }}>✧ FORGED IN THE VOID ✧</Text>
                    </Animated.View>
                </ScrollView>
            </View>
        </BoardSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    voidEnergyLine: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.05,
    },
    content: {
        flex: 1,
        alignItems: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: spacing.md,
    },
    backButton: {
        paddingVertical: 8,
    },
    title: {
        color: colors.arcane.white,
        letterSpacing: 6,
        fontFamily: 'serif',
        textAlign: 'center',
    },
    settingsPanel: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        padding: 20,
        overflow: 'hidden',
    },
    sectionHeader: {
        letterSpacing: 2,
        fontWeight: '900',
        marginBottom: 6,
        fontSize: 10,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: colors.arcane.emerald,
        opacity: 0.2,
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    speedSection: {
        marginTop: 4,
    },
    speedRow: {
        flexDirection: 'row',
        gap: 8,
    },
    speedBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    speedBtnActive: {
        backgroundColor: colors.arcane.emerald,
        borderColor: colors.arcane.emeraldLight,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: 12,
    },
});
