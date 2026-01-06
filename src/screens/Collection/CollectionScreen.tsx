import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedBackground, GlassCard, Text } from '../../components/ui';
import { colors, spacing } from '../../theme';

export const CollectionScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <AnimatedBackground />

            <View style={styles.content}>
                <GlassCard style={styles.card}>
                    <View style={styles.cardContent}>
                        <Text variant="h2" style={styles.title}>
                            Collection
                        </Text>
                        <Text variant="bodySmall" color={colors.text.secondary} style={styles.placeholder}>
                            Card collection will be implemented in Phase 5
                        </Text>
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
    },
    cardContent: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    title: {
        marginBottom: spacing.lg,
    },
    placeholder: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
