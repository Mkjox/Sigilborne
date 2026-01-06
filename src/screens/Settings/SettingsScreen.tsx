import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { AnimatedBackground, GlassCard, Text, Button } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useSettingsStore } from '../../store';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
    navigation: SettingsScreenNavigationProp;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
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
            <AnimatedBackground />

            <View style={styles.content}>
                <GlassCard style={styles.card}>
                    <View style={styles.cardContent}>
                        <Text variant="h2" style={styles.title}>
                            Settings
                        </Text>

                        {/* Audio Settings */}
                        <View style={styles.section}>
                            <Text variant="h4" style={styles.sectionTitle}>
                                Audio
                            </Text>

                            <View style={styles.settingRow}>
                                <Text variant="body">Sound Effects</Text>
                                <Switch
                                    value={soundEnabled}
                                    onValueChange={toggleSound}
                                    trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                                    thumbColor={colors.text.primary}
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <Text variant="body">Music</Text>
                                <Switch
                                    value={musicEnabled}
                                    onValueChange={toggleMusic}
                                    trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                                    thumbColor={colors.text.primary}
                                />
                            </View>
                        </View>

                        {/* Feedback Settings */}
                        <View style={styles.section}>
                            <Text variant="h4" style={styles.sectionTitle}>
                                Feedback
                            </Text>

                            <View style={styles.settingRow}>
                                <Text variant="body">Haptic Feedback</Text>
                                <Switch
                                    value={hapticsEnabled}
                                    onValueChange={toggleHaptics}
                                    trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
                                    thumbColor={colors.text.primary}
                                />
                            </View>
                        </View>

                        {/* Animation Settings */}
                        <View style={styles.section}>
                            <Text variant="h4" style={styles.sectionTitle}>
                                Animation Speed
                            </Text>

                            <View style={styles.speedButtons}>
                                <Button
                                    title="Slow"
                                    variant={animationSpeed === 'slow' ? 'primary' : 'tertiary'}
                                    onPress={() => setAnimationSpeed('slow')}
                                    style={styles.speedButton}
                                />
                                <Button
                                    title="Normal"
                                    variant={animationSpeed === 'normal' ? 'primary' : 'tertiary'}
                                    onPress={() => setAnimationSpeed('normal')}
                                    style={styles.speedButton}
                                />
                                <Button
                                    title="Fast"
                                    variant={animationSpeed === 'fast' ? 'primary' : 'tertiary'}
                                    onPress={() => setAnimationSpeed('fast')}
                                    style={styles.speedButton}
                                />
                            </View>
                        </View>

                        <Button
                            title="Back to Menu"
                            variant="secondary"
                            fullWidth
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        />
                    </View>
                </GlassCard>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    card: {
        maxWidth: 600,
        width: '100%',
    },
    cardContent: {
        padding: spacing.xl,
    },
    title: {
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
        color: colors.secondary[500],
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.secondary,
    },
    speedButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    speedButton: {
        flex: 1,
    },
    backButton: {
        marginTop: spacing.lg,
    },
});
