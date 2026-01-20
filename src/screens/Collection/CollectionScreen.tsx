import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../theme';

type CollectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Collection'>;

interface Props {
    navigation: CollectionScreenNavigationProp;
}

// Placeholder card component
const PlaceholderCard: React.FC<{ delay: number; rarity: string }> = ({ delay, rarity }) => {
    const getRarityColor = () => {
        switch (rarity) {
            case 'legendary': return colors.secondary[500];
            case 'epic': return colors.primary[500];
            case 'rare': return colors.accent[500];
            default: return colors.text.disabled;
        }
    };

    return (
        <Animated.View entering={SlideInUp.delay(delay).springify()}>
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
                style={[styles.card, { borderColor: getRarityColor() }]}
            >
                <View style={[styles.cardIcon, { backgroundColor: getRarityColor() }]}>
                    <Text variant="h4">⚔</Text>
                </View>
                <Text variant="caption" color={colors.text.disabled} style={styles.cardLabel}>
                    {rarity.toUpperCase()}
                </Text>
            </LinearGradient>
        </Animated.View>
    );
};

export const CollectionScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const placeholderCards = [
        { id: 1, rarity: 'common' },
        { id: 2, rarity: 'common' },
        { id: 3, rarity: 'rare' },
        { id: 4, rarity: 'rare' },
        { id: 5, rarity: 'epic' },
        { id: 6, rarity: 'legendary' },
    ];

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

            <View style={[
                styles.content,
                {
                    paddingTop: insets.top + spacing.md,
                    paddingBottom: insets.bottom + spacing.md,
                    paddingLeft: insets.left + spacing.lg,
                    paddingRight: insets.right + spacing.lg,
                }
            ]}>
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
                    <Text variant="h3" style={styles.title}>Collection</Text>
                    <View style={styles.backButton} />
                </Animated.View>

                {/* Stats bar */}
                <Animated.View
                    entering={FadeIn.delay(200)}
                    style={styles.statsBar}
                >
                    <View style={styles.stat}>
                        <Text variant="h4" color={colors.secondary[400]}>0</Text>
                        <Text variant="caption" color={colors.text.disabled}>Cards</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text variant="h4" color={colors.primary[400]}>0</Text>
                        <Text variant="caption" color={colors.text.disabled}>Decks</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text variant="h4" color={colors.accent[400]}>0</Text>
                        <Text variant="caption" color={colors.text.disabled}>Gold</Text>
                    </View>
                </Animated.View>

                {/* Cards grid */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsContainer}
                >
                    {placeholderCards.map((card, index) => (
                        <PlaceholderCard
                            key={card.id}
                            rarity={card.rarity}
                            delay={300 + index * 100}
                        />
                    ))}
                </ScrollView>

                {/* Coming soon message */}
                <Animated.View
                    entering={FadeIn.delay(800)}
                    style={styles.comingSoon}
                >
                    <Text variant="body" color={colors.text.secondary} style={styles.comingSoonText}>
                        🎴 Full collection coming soon!
                    </Text>
                    <Text variant="caption" color={colors.text.disabled}>
                        Win games to earn new cards
                    </Text>
                </Animated.View>
            </View>
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
        backgroundColor: colors.accent[500],
        bottom: -150,
        left: -150,
        opacity: 0.2,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 60,
    },
    title: {
        textAlign: 'center',
        color: colors.text.primary,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.lg,
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cardsContainer: {
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    card: {
        width: 100,
        height: 140,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    cardLabel: {
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    comingSoon: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comingSoonText: {
        marginBottom: spacing.xs,
    },
});
