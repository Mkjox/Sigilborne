import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RootStackParamList, Card } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getCardDimensions, getLayoutDimensions } from '../../theme';

type CollectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Collection'>;

interface Props {
    navigation: CollectionScreenNavigationProp;
}

// Reuse the mock data from DeckBuilder for consistency (in a real app this would come from a store)
const COLLECTION_CARDS: Card[] = [
    { id: 'u1', name: 'Knight', manaCost: 2, power: 4, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u2', name: 'Archer', manaCost: 3, power: 3, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u3', name: 'Giant', manaCost: 6, power: 8, type: 'unit', rarity: 'rare', description: '', abilities: [], artwork: '' },
    { id: 's1', name: 'Rain', manaCost: 2, type: 'spell', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u4', name: 'Hero', manaCost: 10, power: 10, type: 'unit', rarity: 'legendary', description: '', abilities: [], artwork: '' },
    { id: 's2', name: 'Storm', manaCost: 5, type: 'weather', rarity: 'epic', description: '', abilities: [], artwork: '' },
    // More cards to demonstrate scrolling
    { id: 'u5', name: 'Soldier', manaCost: 1, power: 2, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u6', name: 'Captain', manaCost: 4, power: 5, type: 'unit', rarity: 'rare', description: '', abilities: [], artwork: '' },
];

export const CollectionScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const layout = getLayoutDimensions(screenWidth, screenHeight);
    const cardDims = getCardDimensions(screenWidth, screenHeight);

    // Slightly larger cards for the collection view compared to deck builder
    const cardWidth = cardDims.width;
    const cardHeight = cardDims.height;

    // Calculate columns based on available width and card size
    // Using full width minus padding
    const availableWidth = screenWidth - (layout.contentPadding * 2);
    // Card width + gap
    const itemWidth = cardWidth + 16;
    const numColumns = Math.floor(availableWidth / itemWidth);

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
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                }
            ]}>
                {/* Header */}
                <Animated.View
                    entering={FadeIn.delay(100)}
                    style={[styles.header, { paddingHorizontal: layout.contentPadding, paddingTop: spacing.sm }]}
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
                    style={styles.statsContainer}
                >
                    <View style={styles.statsBar}>
                        <View style={styles.stat}>
                            <Text variant="h4" color={colors.secondary[400]}>{COLLECTION_CARDS.length}</Text>
                            <Text variant="caption" color={colors.text.disabled}>Cards</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text variant="h4" color={colors.primary[400]}>8</Text>
                            <Text variant="caption" color={colors.text.disabled}>Decks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text variant="h4" color={colors.accent[400]}>1250</Text>
                            <Text variant="caption" color={colors.text.disabled}>Gold</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Cards grid */}
                <FlatList
                    data={COLLECTION_CARDS}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    // Force a fresh render when columns change
                    key={`grid-${numColumns}`}
                    contentContainerStyle={{
                        paddingHorizontal: layout.contentPadding,
                        paddingBottom: spacing.xl
                    }}
                    columnWrapperStyle={{
                        justifyContent: 'center',
                        gap: 16,
                        marginBottom: 16
                    }}
                    renderItem={({ item }) => (
                        <CardComponent
                            card={item}
                            width={cardWidth}
                            height={cardHeight}
                            isPlayable={false}
                            onPress={() => { }}
                        />
                    )}
                />
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
    statsContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
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
});
