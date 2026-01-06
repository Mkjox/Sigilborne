import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { AnimatedBackground, Button, GlassCard, Text } from '../../components/ui';
import { colors, spacing } from '../../theme';

type MainMenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
    navigation: MainMenuScreenNavigationProp;
}

const { width } = Dimensions.get('window');

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <AnimatedBackground />

            <View style={styles.content}>
                {/* Title */}
                <GlassCard style={styles.titleCard} glowColor={colors.primary[500]}>
                    <View style={styles.titleContent}>
                        <Text variant="h1" style={styles.title}>
                            CARD LEGENDS
                        </Text>
                        <Text variant="bodySmall" color={colors.text.secondary}>
                            A Strategic Card Battle Game
                        </Text>
                    </View>
                </GlassCard>

                {/* Menu Buttons */}
                <View style={styles.menuContainer}>
                    <GlassCard style={styles.menuCard}>
                        <View style={styles.buttonContainer}>
                            <Button
                                title="PLAY"
                                variant="primary"
                                fullWidth
                                onPress={() => navigation.navigate('GameBoard', { difficulty: 'medium' })}
                            />
                            <Button
                                title="COLLECTION"
                                variant="secondary"
                                fullWidth
                                onPress={() => navigation.navigate('Collection')}
                            />
                            <Button
                                title="DECK BUILDER"
                                variant="secondary"
                                fullWidth
                                onPress={() => navigation.navigate('DeckBuilder')}
                            />
                            <Button
                                title="SETTINGS"
                                variant="tertiary"
                                fullWidth
                                onPress={() => navigation.navigate('Settings')}
                            />
                        </View>
                    </GlassCard>
                </View>
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
    titleCard: {
        marginBottom: spacing['2xl'],
    },
    titleContent: {
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    title: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    menuContainer: {
        width: Math.min(width * 0.6, 400),
    },
    menuCard: {
        padding: spacing.lg,
    },
    buttonContainer: {
        gap: spacing.md,
    },
});
