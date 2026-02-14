import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { RootStackParamList, Card, CardType } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getLayoutDimensions, getCardDimensions } from '../../theme';
import { useDeckStore } from '../../store/deckStore';
import { getAllCards } from '../../data/cardData';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;

interface Props {
    navigation: DeckBuilderScreenNavigationProp;
}

const ALL_CARDS = getAllCards();

const AnimatedBackground: React.FC = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void, colors.arcane.obsidian]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.voidMist} />
        </View>
    );
};

export const DeckBuilderScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const {
        decks,
        activeDeckId,
        addCardToDeck,
        removeCardFromDeck,
        createDeck,
        setActiveDeck
    } = useDeckStore();

    const [selectedCategory, setSelectedCategory] = useState<'all' | CardType>('all');

    const activeDeck = useMemo(() => decks.find(d => d.id === activeDeckId), [decks, activeDeckId]);
    const layout = getLayoutDimensions(screenWidth, screenHeight);
    const cardDims = getCardDimensions(screenWidth, screenHeight);

    const filteredCards = useMemo(() => {
        if (selectedCategory === 'all') return ALL_CARDS;
        return ALL_CARDS.filter(card => card.type === selectedCategory);
    }, [selectedCategory]);

    const isCardInDeckCount = (cardId: string) => {
        if (!activeDeck) return 0;
        return activeDeck.cards.filter(card => card.name === ALL_CARDS.find(c => c.id === cardId)?.name).length;
    };

    const handleCreateDeck = () => {
        const id = createDeck(`New Deck ${decks.length + 1}`);
        setActiveDeck(id);
    };

    return (
        <BoardSurface style={styles.container}>
            <AnimatedBackground />

            <View style={[styles.content, {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right
            }]}>
                {/* Header */}
                <View style={[styles.header, { paddingHorizontal: layout.contentPadding }]}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text variant="body" color={colors.arcane.emerald} style={{ fontWeight: '900', letterSpacing: 1 }}>← VOID</Text>
                    </Pressable>
                    <Text variant="h2" style={styles.title}>FORGE</Text>
                    <View style={{ width: 80 }} />
                </View>

                <View style={styles.mainContent}>
                    {/* LEFT PANEL: ACTIVE DECK */}
                    <View style={styles.leftPanel}>
                        <LinearGradient
                            colors={['rgba(11, 15, 20, 0.95)', 'rgba(31, 41, 55, 0.4)']}
                            style={[styles.panelBackground, { borderRightWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' }]}
                        />

                        <View style={styles.panelHeader}>
                            <Text variant="caption" color={colors.arcane.emerald} style={styles.panelTitle}>CONSTRUCT</Text>
                            {activeDeck && (
                                <Text variant="caption" color={colors.text.disabled}>{activeDeck.cards.length}/25</Text>
                            )}
                        </View>

                        {!activeDeck ? (
                            <View style={styles.emptyDeck}>
                                <Text variant="body" color={colors.text.disabled} style={{ textAlign: 'center', marginBottom: 20 }}>NO ACTIVE DECK</Text>
                                <Pressable onPress={handleCreateDeck} style={styles.createBtn}>
                                    <Text variant="button" color={colors.arcane.white}>CREATE DECK</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={{ flex: 1 }}>
                                <View style={styles.deckNameBar}>
                                    <Text variant="h4" color={colors.arcane.white}>{activeDeck.name.toUpperCase()}</Text>
                                </View>
                                <FlatList
                                    data={activeDeck.cards}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    renderItem={({ item, index }) => {
                                        return (
                                            <Animated.View entering={FadeIn.delay(index * 20)}>
                                                <Pressable
                                                    onPress={() => removeCardFromDeck(activeDeckId!, item.id)}
                                                    style={styles.deckItem}
                                                >
                                                    <View style={styles.deckItemCost}>
                                                        <Text variant="caption" color={colors.arcane.cyan}>{item.manaCost}</Text>
                                                    </View>
                                                    <Text variant="body" color={colors.arcane.white} style={{ flex: 1, fontSize: 12 }}>{item.name.toUpperCase()}</Text>
                                                    <Text variant="caption" color={colors.error}>×</Text>
                                                </Pressable>
                                            </Animated.View>
                                        );
                                    }}
                                    contentContainerStyle={{ padding: 12 }}
                                />
                            </View>
                        )}
                    </View>

                    {/* RIGHT PANEL: CARD LIBRARY */}
                    <View style={styles.rightPanel}>
                        <View style={styles.panelHeader}>
                            <Text variant="caption" color={colors.arcane.emerald} style={styles.panelTitle}>LIBRARY</Text>
                            <View style={styles.filterRow}>
                                {['all', 'unit', 'spell'].map((cat) => (
                                    <Pressable
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat as any)}
                                        style={[styles.filterChip, selectedCategory === cat && { borderColor: colors.arcane.emerald, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                                    >
                                        <Text variant="caption" color={selectedCategory === cat ? colors.arcane.emerald : colors.text.disabled}>{cat.toUpperCase()}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <FlatList
                            data={filteredCards}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeIn.delay(index * 10)} style={styles.libraryCardWrapper}>
                                    <CardComponent
                                        card={item}
                                        width={cardDims.width * 0.8}
                                        height={cardDims.height * 0.8}
                                        onPress={() => activeDeckId && activeDeck!.cards.length < 25 && addCardToDeck(activeDeckId, item)}
                                        isPlayable={activeDeckId ? activeDeck!.cards.length < 25 : false}
                                    />
                                    {isCardInDeckCount(item.id) > 0 && (
                                        <View style={styles.cardCountBadge}>
                                            <Text variant="caption" color={colors.arcane.white} style={{ fontSize: 10 }}>{isCardInDeckCount(item.id)}</Text>
                                        </View>
                                    )}
                                </Animated.View>
                            )}
                            contentContainerStyle={{ padding: 12 }}
                            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                        />
                    </View>
                </View>
            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    backButton: {
        minWidth: 80,
    },
    title: {
        color: colors.arcane.white,
        letterSpacing: 8,
        fontFamily: 'serif',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    leftPanel: {
        flex: 1.2,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    rightPanel: {
        flex: 2.8,
    },
    panelBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderBottomWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        height: 48,
    },
    panelTitle: {
        fontWeight: '900',
        letterSpacing: 2,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyDeck: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    createBtn: {
        backgroundColor: colors.arcane.emeraldDark,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 2,
    },
    deckNameBar: {
        padding: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        alignItems: 'center',
    },
    deckItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.4)',
        marginBottom: 4,
        padding: 8,
        borderRadius: 2,
        borderLeftWidth: 2,
        borderLeftColor: colors.arcane.emerald,
    },
    deckItemCost: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.arcane.cyan,
    },
    libraryCardWrapper: {
        position: 'relative',
    },
    cardCountBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.arcane.emerald,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: colors.arcane.white,
    },
});
