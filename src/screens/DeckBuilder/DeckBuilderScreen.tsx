import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { RootStackParamList, Card, CardRarity, CardType } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getLayoutDimensions, getCardDimensions } from '../../theme';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;

interface Props {
    navigation: DeckBuilderScreenNavigationProp;
}

// Mock cards for the deck builder view
const ALL_CARDS: Card[] = [
    { id: 'u1', name: 'Knight', manaCost: 2, power: 4, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    {
        id: 'u2', name: 'Archer', manaCost: 3, power: 3, type: 'unit', rarity: 'common', description: '', abilities: [
            { id: 'a1', type: 'deploy', name: 'Shot', description: 'Deal 1 damage', effect: (context) => context.G, trigger: 'onPlay' }
        ], artwork: ''
    },
    { id: 'u3', name: 'Giant', manaCost: 6, power: 8, type: 'unit', rarity: 'rare', description: '', abilities: [], artwork: '' },
    { id: 's1', name: 'Rain', manaCost: 2, type: 'spell', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u4', name: 'Hero', manaCost: 10, power: 10, type: 'unit', rarity: 'legendary', description: '', abilities: [], artwork: '' },
    { id: 's2', name: 'Storm', manaCost: 5, type: 'weather', rarity: 'epic', description: '', abilities: [], artwork: '' },
    // Duplicates to fill the grid
    { id: 'u1_c', name: 'Knight', manaCost: 2, power: 4, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u2_c', name: 'Archer', manaCost: 3, power: 3, type: 'unit', rarity: 'common', description: '', abilities: [], artwork: '' },
    { id: 'u3_c', name: 'Giant', manaCost: 6, power: 8, type: 'unit', rarity: 'rare', description: '', abilities: [], artwork: '' },
    { id: 's1_c', name: 'Rain', manaCost: 2, type: 'spell', rarity: 'common', description: '', abilities: [], artwork: '' },
];

const DeckSlot: React.FC<{ index: number; isActive: boolean; onPress: () => void; width: number }> = ({
    index,
    isActive,
    onPress,
    width
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
                    isActive && styles.deckSlotActive,
                    { minHeight: 60 }
                ]}
            >
                <View style={styles.deckSlotContent}>
                    <Text variant="h4" color={isActive ? colors.text.primary : colors.text.disabled}>
                        {index + 1}
                    </Text>
                    <View style={styles.deckSlotInfo}>
                        <Text
                            variant="bodySmall"
                            color={isActive ? colors.text.primary : colors.text.disabled}
                        >
                            {isActive ? 'Custom Deck' : 'Empty Deck'}
                        </Text>
                        <Text variant="caption" color={isActive ? 'rgba(255,255,255,0.7)' : colors.text.disabled}>
                            {isActive ? '25/25 Cards' : '0/25 Cards'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    </Animated.View>
);

const CategoryButton: React.FC<{
    label: string;
    isActive: boolean;
    onPress: () => void;
}> = ({ label, isActive, onPress }) => (
    <Pressable onPress={onPress}>
        <View style={[styles.categoryButton, isActive && styles.categoryButtonActive]}>
            <Text
                variant="bodySmall"
                color={isActive ? colors.primary[400] : colors.text.secondary}
            >
                {label}
            </Text>
        </View>
    </Pressable>
);

export const DeckBuilderScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [selectedDeck, setSelectedDeck] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get responsive dimensions
    const layout = getLayoutDimensions(screenWidth, screenHeight);
    const cardDims = getCardDimensions(screenWidth, screenHeight);

    // Slightly smaller cards for the collection grid to fit more
    const gridCardWidth = cardDims.width * 0.9;
    const gridCardHeight = cardDims.height * 0.9;

    const filteredCards = ALL_CARDS.filter(card =>
        selectedCategory === 'all' ||
        (selectedCategory === 'units' && card.type === 'unit') ||
        (selectedCategory === 'spells' && card.type === 'spell') ||
        (selectedCategory === 'special' && (card.type === 'weather'))
    );

    const categories = [
        { id: 'all', label: 'All Cards' },
        { id: 'units', label: 'Units' },
        { id: 'spells', label: 'Spells' },
        { id: 'special', label: 'Special' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
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
                <View style={[styles.header, { paddingHorizontal: layout.contentPadding }]}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text variant="body" color={colors.primary[400]}>← Back</Text>
                    </Pressable>
                    <Text variant="h3" style={styles.title}>Deck Builder</Text>
                    <View style={styles.backButton} />
                </View>

                <View style={styles.mainContent}>
                    {/* Left Panel: Decks */}
                    <View style={[styles.leftPanel, { width: layout.leftPanelWidth, padding: layout.contentPadding }]}>
                        <Text variant="bodySmall" color={colors.text.secondary} style={styles.sectionTitle}>
                            YOUR DECKS
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {[0, 1, 2, 3].map((index) => (
                                <DeckSlot
                                    key={index}
                                    index={index}
                                    isActive={selectedDeck === index}
                                    onPress={() => setSelectedDeck(index)}
                                    width={layout.leftPanelWidth - (layout.contentPadding * 2)}
                                />
                            ))}
                        </ScrollView>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Right Panel: Card Collection */}
                    <View style={[styles.rightPanel, { width: layout.rightPanelWidth }]}>
                        {/* Categories Filter */}
                        <View style={[styles.filterBar, { paddingHorizontal: layout.contentPadding }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {categories.map((cat) => (
                                    <CategoryButton
                                        key={cat.id}
                                        label={cat.label}
                                        isActive={selectedCategory === cat.id}
                                        onPress={() => setSelectedCategory(cat.id)}
                                    />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Card Grid */}
                        <FlatList
                            data={filteredCards}
                            keyExtractor={(item) => item.id}
                            numColumns={Math.floor((layout.rightPanelWidth - layout.contentPadding * 2) / (gridCardWidth + 10))}
                            contentContainerStyle={[styles.gridContent, { padding: layout.contentPadding }]}
                            columnWrapperStyle={{ gap: 10 }}
                            renderItem={({ item }) => (
                                <View style={{ marginBottom: 10 }}>
                                    <CardComponent
                                        card={item}
                                        width={gridCardWidth}
                                        height={gridCardHeight}
                                        isPlayable={false}
                                        onPress={() => { }}
                                    />
                                </View>
                            )}
                        />
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
    content: {
        flex: 1,
    },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    backButton: {
        width: 60,
    },
    title: {
        color: colors.text.primary,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    leftPanel: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    sectionTitle: {
        marginBottom: spacing.sm,
        letterSpacing: 1,
        opacity: 0.7,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    rightPanel: {
        flex: 1,
    },
    filterBar: {
        height: 50,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    categoryButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(102, 0, 255, 0.15)',
        borderColor: colors.primary[500],
    },
    deckSlot: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.xs,
    },
    deckSlotContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deckSlotInfo: {
        marginLeft: spacing.sm,
    },
    deckSlotActive: {
        borderColor: colors.primary[400],
        backgroundColor: 'rgba(102, 0, 255, 0.1)',
    },
    gridContent: {
        paddingBottom: spacing.xl,
    }
});
