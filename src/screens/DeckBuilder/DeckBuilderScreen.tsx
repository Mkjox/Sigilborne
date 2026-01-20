import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../theme';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;

interface Props {
    navigation: DeckBuilderScreenNavigationProp;
}

// Placeholder deck slot
const DeckSlot: React.FC<{ index: number; isActive: boolean; onPress: () => void }> = ({
    index,
    isActive,
    onPress
}) => (
    <Animated.View entering={SlideInLeft.delay(200 + index * 100).springify()}>
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={isActive
                    ? [colors.primary[400], colors.primary[600]]
                    : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
                }
                style={[
                    styles.deckSlot,
                    isActive && styles.deckSlotActive
                ]}
            >
                <Text variant="h4" color={isActive ? colors.text.primary : colors.text.disabled}>
                    {index + 1}
                </Text>
                <Text
                    variant="caption"
                    color={isActive ? colors.text.primary : colors.text.disabled}
                >
                    {isActive ? 'Default' : 'Empty'}
                </Text>
            </LinearGradient>
        </Pressable>
    </Animated.View>
);

// Card category button
const CategoryButton: React.FC<{
    label: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
    delay: number;
}> = ({ label, count, isActive, onPress, delay }) => (
    <Animated.View entering={SlideInRight.delay(delay).springify()}>
        <Pressable onPress={onPress}>
            <View style={[styles.categoryButton, isActive && styles.categoryButtonActive]}>
                <Text
                    variant="bodySmall"
                    color={isActive ? colors.primary[400] : colors.text.secondary}
                >
                    {label}
                </Text>
                <Text variant="caption" color={colors.text.disabled}>
                    {count}
                </Text>
            </View>
        </Pressable>
    </Animated.View>
);

export const DeckBuilderScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [selectedDeck, setSelectedDeck] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All', count: 0 },
        { id: 'units', label: 'Units', count: 0 },
        { id: 'spells', label: 'Spells', count: 0 },
        { id: 'special', label: 'Special', count: 0 },
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

            {/* Decorative glows */}
            <Animated.View
                entering={FadeIn.delay(200).duration(1000)}
                style={styles.glowOrbLeft}
            />
            <Animated.View
                entering={FadeIn.delay(400).duration(1000)}
                style={styles.glowOrbRight}
            />

            <View style={[
                styles.content,
                {
                    paddingTop: insets.top + spacing.md,
                    paddingBottom: insets.bottom + spacing.md,
                    paddingLeft: insets.left + spacing.md,
                    paddingRight: insets.right + spacing.md,
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
                    <Text variant="h3" style={styles.title}>Deck Builder</Text>
                    <View style={styles.backButton} />
                </Animated.View>

                {/* Main content - horizontal layout */}
                <View style={styles.mainContent}>
                    {/* Left panel - Deck slots */}
                    <View style={styles.leftPanel}>
                        <Text variant="bodySmall" color={colors.text.secondary} style={styles.panelTitle}>
                            YOUR DECKS
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {[0, 1, 2].map((index) => (
                                <DeckSlot
                                    key={index}
                                    index={index}
                                    isActive={selectedDeck === index}
                                    onPress={() => setSelectedDeck(index)}
                                />
                            ))}
                        </ScrollView>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Right panel - Card selection */}
                    <View style={styles.rightPanel}>
                        {/* Categories */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoriesScroll}
                        >
                            {categories.map((cat, index) => (
                                <CategoryButton
                                    key={cat.id}
                                    label={cat.label}
                                    count={cat.count}
                                    isActive={selectedCategory === cat.id}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    delay={400 + index * 50}
                                />
                            ))}
                        </ScrollView>

                        {/* Empty state */}
                        <Animated.View
                            entering={FadeIn.delay(600)}
                            style={styles.emptyState}
                        >
                            <Text variant="h4" color={colors.text.disabled}>🃏</Text>
                            <Text variant="body" color={colors.text.secondary} style={styles.emptyText}>
                                Coming Soon!
                            </Text>
                            <Text variant="caption" color={colors.text.disabled} style={styles.emptySubtext}>
                                Build custom decks from your collection
                            </Text>
                        </Animated.View>
                    </View>
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
    glowOrbLeft: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: colors.primary[500],
        top: -60,
        left: -60,
        opacity: 0.15,
    },
    glowOrbRight: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.accent[500],
        bottom: -50,
        right: -50,
        opacity: 0.15,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backButton: {
        width: 50,
    },
    title: {
        textAlign: 'center',
        color: colors.text.primary,
        fontSize: 18,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    leftPanel: {
        width: 80,
    },
    panelTitle: {
        marginBottom: spacing.xs,
        letterSpacing: 1,
        fontSize: 10,
    },
    divider: {
        width: 1,
        marginHorizontal: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    rightPanel: {
        flex: 1,
    },
    deckSlot: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.xs,
        alignItems: 'center',
    },
    deckSlotActive: {
        borderColor: colors.primary[400],
    },
    categoriesScroll: {
        flexGrow: 0,
        marginBottom: spacing.sm,
    },
    categoryButton: {
        paddingVertical: 4,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: spacing.xs,
        alignItems: 'center',
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(102, 0, 255, 0.2)',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: spacing.xs,
        fontSize: 14,
    },
    emptySubtext: {
        marginTop: 2,
        textAlign: 'center',
        fontSize: 11,
    },
});
