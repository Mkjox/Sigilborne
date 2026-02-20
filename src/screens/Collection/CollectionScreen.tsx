import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { RootStackParamList, Card, CardType } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getCardDimensions, getLayoutDimensions } from '../../theme';
import { getAllCards } from '../../data/cardData';
import { useDeckStore } from '../../store/deckStore';

type CollectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Collection'>;

interface Props {
    navigation: CollectionScreenNavigationProp;
}

const ALL_CARDS = getAllCards();

const AnimatedBackground: React.FC = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void, colors.arcane.obsidian]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Subtle Void Mist */}
            <View style={styles.voidMist} />
        </View>
    );
};

export const CollectionScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { decks } = useDeckStore();

    const [selectedCategory, setSelectedCategory] = useState<'all' | CardType>('all');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const layout = getLayoutDimensions(screenWidth, screenHeight);
    const cardDims = getCardDimensions(screenWidth, screenHeight);

    const cardWidth = cardDims.width * 1.1;
    const cardHeight = cardDims.height * 1.1;

    const categories: { id: 'all' | CardType; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'unit', label: 'Units' },
        { id: 'spell', label: 'Spells' },
        { id: 'weather', label: 'Weather' },
    ];

    const filteredCards = useMemo(() => {
        if (selectedCategory === 'all') return ALL_CARDS;
        return ALL_CARDS.filter(card => card.type === selectedCategory);
    }, [selectedCategory]);

    const numColumns = Math.floor((screenWidth - layout.contentPadding * 2) / (cardWidth + 16));

    return (
        <BoardSurface style={styles.container}>
            <AnimatedBackground />

            {/* 1. TOP BAR (The "Upper Layer") */}
            <View style={styles.headerBar}>
                <View style={{ paddingTop: insets.top }}>
                    {/* Header */}
                    <Animated.View
                        entering={SlideInLeft.duration(600).springify()}
                        style={[styles.header, { paddingHorizontal: layout.contentPadding, paddingTop: spacing.sm }]}
                    >
                        <Pressable
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Text variant="body" color={colors.arcane.emerald} style={styles.backText}>← VOID</Text>
                        </Pressable>
                        <View style={styles.titleContainer}>
                            <Text variant="h2" style={styles.title}>COLLECTION</Text>
                            <View style={styles.titleUnderline} />
                        </View>
                        <View style={styles.backButton} />
                    </Animated.View>

                    {/* Categories & Stats Row */}
                    <View style={[styles.metaRow, { paddingHorizontal: layout.contentPadding }]}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryScroll}
                        >
                            {categories.map((cat, idx) => (
                                <Animated.View key={cat.id} entering={FadeIn.delay(300 + idx * 50)}>
                                    <Pressable
                                        onPress={() => { setSelectedCategory(cat.id); setSelectedCardId(null); }}
                                        style={[
                                            styles.categoryBtn,
                                            selectedCategory === cat.id && styles.categoryBtnActive
                                        ]}
                                    >
                                        <Text
                                            variant="caption"
                                            color={selectedCategory === cat.id ? colors.arcane.obsidian : colors.arcane.emerald}
                                            style={{ fontWeight: '900', letterSpacing: 1 }}
                                        >
                                            {cat.label.toUpperCase()}
                                        </Text>
                                    </Pressable>
                                </Animated.View>
                            ))}
                        </ScrollView>

                        <Animated.View entering={FadeIn.delay(500)} style={styles.statsGlass}>
                            <View style={styles.statItem}>
                                <Text variant="h4" color={colors.arcane.emerald} style={{ fontWeight: '900' }}>{ALL_CARDS.length}</Text>
                                <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 8 }}>CARDS</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text variant="h4" color={colors.arcane.cyan} style={{ fontWeight: '900' }}>{decks.length}</Text>
                                <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 8 }}>DECKS</Text>
                            </View>
                        </Animated.View>
                    </View>
                </View>
            </View>

            {/* 2. MAIN GRID AREA */}
            <View style={styles.gridContainer}>
                <FlatList
                    data={filteredCards}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={`grid-${numColumns}`}
                    contentContainerStyle={{
                        paddingHorizontal: layout.contentPadding,
                        paddingBottom: spacing.xl + 100,
                        paddingTop: spacing.md
                    }}
                    columnWrapperStyle={{
                        justifyContent: 'flex-start',
                        gap: 16,
                        marginBottom: 16
                    }}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeIn.delay(Math.min(index * 30, 1000))}>
                            <CardComponent
                                card={item}
                                width={cardWidth}
                                height={cardHeight}
                                isPlayable={false}
                                isSelected={selectedCardId === item.id}
                                onPress={() => setSelectedCardId(selectedCardId === item.id ? null : item.id)}
                            />
                        </Animated.View>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* 3. OVERLAY LAYER (Absolute bottom of JSX = Top z-index) */}
            {selectedCardId && (() => {
                const card = ALL_CARDS.find(c => c.id === selectedCardId);
                if (card) return (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
                        <Pressable style={styles.backdrop} onPress={() => setSelectedCardId(null)} />

                        <View style={styles.cardDetailsPanel}>
                            <View style={styles.cardDetailHeader}>
                                <Text variant="h4" color={colors.arcane.white} style={{ flex: 1, fontFamily: 'serif', letterSpacing: 2 }}>{card.name.toUpperCase()}</Text>
                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                    <View style={[styles.miniBadge, { borderColor: colors.arcane.cyan }]}>
                                        <Text variant="caption" color={colors.arcane.cyan}>{card.manaCost}</Text>
                                    </View>
                                    {card.power !== undefined && (
                                        <View style={[styles.miniBadge, { borderColor: colors.error }]}>
                                            <Text variant="caption" color={colors.error}>{card.power}</Text>
                                        </View>
                                    )}
                                    <Pressable onPress={() => setSelectedCardId(null)} style={styles.closeBtn}>
                                        <Text variant="h4" color={colors.arcane.emerald}>✕</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <Text variant="caption" color={colors.arcane.emerald} style={{ fontStyle: 'italic', marginBottom: 8, opacity: 0.7 }}>
                                {card.flavorText || "A mysterious echo from the void."}
                            </Text>
                            <Text variant="body" color={colors.arcane.white} style={{ fontSize: 13, lineHeight: 18, opacity: 0.9 }}>
                                {card.description}
                            </Text>
                        </View>
                    </Animated.View>
                );
                return null;
            })()}
        </BoardSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    voidMist: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 185, 129, 0.02)',
    },
    content: {
        flex: 1,
    },
    headerBar: {
        backgroundColor: 'rgba(11, 15, 20, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16, 185, 129, 0.1)',
        zIndex: 10,
        elevation: 5,
    },
    gridContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    backButton: {
        minWidth: 60,
    },
    backText: {
        fontWeight: '900',
        letterSpacing: 1,
        fontSize: 10,
    },
    titleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    title: {
        textAlign: 'center',
        color: colors.arcane.white,
        letterSpacing: 4,
        fontFamily: 'serif',
        fontSize: 18,
    },
    titleUnderline: {
        width: 40,
        height: 1,
        backgroundColor: colors.arcane.emerald,
        marginTop: 2,
        opacity: 0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    categoryScroll: {
        gap: spacing.xs,
        paddingRight: spacing.md,
    },
    categoryBtn: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 2,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginRight: spacing.xs,
    },
    categoryBtnActive: {
        backgroundColor: colors.arcane.emerald,
        borderColor: colors.arcane.emeraldLight,
    },
    statsGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(11, 15, 20, 0.8)',
        borderRadius: 2,
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        minWidth: 40,
    },
    statDivider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: spacing.xs,
    },
    cardDetailsPanel: {
        position: 'absolute',
        bottom: spacing.xl + 20,
        left: '10%',
        right: '10%',
        backgroundColor: 'rgba(11, 15, 20, 1)', // Darker for readability
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        borderRadius: 2,
        padding: spacing.md,
        zIndex: 1000, // Very high
        elevation: 20,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    cardDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    miniBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
    },
    closeBtn: {
        marginLeft: 10,
        padding: 5,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
});
