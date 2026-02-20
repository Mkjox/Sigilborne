import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    useWindowDimensions,
    FlatList,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInLeft,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { RootStackParamList, Card, CardType } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing } from '../../theme';
import { useDeckStore } from '../../store/deckStore';
import { getAllCards } from '../../data/cardData';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;
interface Props { navigation: DeckBuilderScreenNavigationProp; }

const ALL_CARDS = getAllCards();

// --- Components ---

const SigilIcon = ({ active, label, onPress, icon }: { active: boolean; label: string; onPress: () => void; icon: string }) => {
    return (
        <Pressable onPress={onPress} style={styles.sigilItem}>
            <View style={[styles.sigilHex, active && styles.sigilHexActive]}>
                <Text style={[styles.sigilIconText, active && styles.sigilTextActive]}>{icon}</Text>
            </View>
            <Text style={[styles.sigilLabel, active && styles.sigilTextActive]}>{label}</Text>
        </Pressable>
    );
};

const DeckCardRow = ({ card, onRemove, index }: { card: Card; onRemove: () => void; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 20)} style={styles.deckCardRow}>
        <View style={styles.deckCardMana}>
            <Text style={styles.manaText}>{card.manaCost}</Text>
        </View>
        <Text style={styles.deckCardName} numberOfLines={1}>{card.name.toUpperCase()}</Text>
        <Pressable onPress={onRemove} style={styles.removeBtn}>
            <Text style={styles.removeText}>✕</Text>
        </Pressable>
    </Animated.View>
);

export const DeckBuilderScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { width: sw, height: sh } = useWindowDimensions();
    const {
        decks, activeDeckId,
        addCardToDeck, removeCardFromDeck, createDeck, deleteDeck, setActiveDeck,
    } = useDeckStore();

    const [filter, setFilter] = useState<'all' | CardType>('all');
    const [libWidth, setLibWidth] = useState(0);

    const activeDeck = useMemo(() => decks.find(d => d.id === activeDeckId), [decks, activeDeckId]);
    const filteredCards = useMemo(() => {
        if (filter === 'all') return ALL_CARDS;
        return ALL_CARDS.filter(c => c.type === filter);
    }, [filter]);

    const cardCountInDeck = (cardId: string) => {
        if (!activeDeck) return 0;
        const cardName = ALL_CARDS.find(c => c.id === cardId)?.name;
        return activeDeck.cards.filter(c => c.name === cardName).length;
    };

    const handleCreateDeck = () => {
        const id = createDeck(`Deck ${decks.length + 1}`);
        setActiveDeck(id);
    };

    const isDeckFull = activeDeck && activeDeck.cards.length >= 25;

    // Shrink cards: 4 columns for a better "Vault" feel
    const cardW = libWidth > 0 ? (libWidth / 4) - 10 : 80;
    const cardH = cardW * 1.4;

    return (
        <View style={styles.container}>
            {/* Background Layer */}
            <LinearGradient
                colors={[colors.arcane.obsidian, colors.arcane.void]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.layout, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

                {/* 1. THE SIGILS (Left Pillar - 15%) */}
                <View style={styles.sigilPillar}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>‹</Text>
                    </Pressable>
                    <View style={styles.spacer} />
                    <SigilIcon active={filter === 'all'} label="ALL" icon="◈" onPress={() => setFilter('all')} />
                    <SigilIcon active={filter === 'unit'} label="UNITS" icon="⚔" onPress={() => setFilter('unit')} />
                    <SigilIcon active={filter === 'spell'} label="SPELLS" icon="🝧" onPress={() => setFilter('spell')} />
                    <View style={styles.spacer} />
                </View>

                {/* Vertical Void Line */}
                <View style={styles.voidLine} />

                {/* 2. THE VAULT (Center Pillar - 60%) */}
                <View style={[styles.vaultPillar, { flex: 0.75 }]} onLayout={(e) => setLibWidth(e.nativeEvent.layout.width)}>
                    <View style={styles.pillarHeader}>
                        <Text style={styles.pillarTitle}>VAULT</Text>
                        <Text style={styles.pillarCount}>{filteredCards.length} ESSENCES</Text>
                    </View>
                    <FlatList
                        data={filteredCards}
                        numColumns={4}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => {
                            const count = cardCountInDeck(item.id);
                            return (
                                <Animated.View entering={FadeIn.delay(index * 10)} style={styles.vaultCardWrapper}>
                                    <CardComponent
                                        card={item}
                                        width={cardW}
                                        height={cardH}
                                        onPress={() => activeDeckId && !isDeckFull && addCardToDeck(activeDeckId, item)}
                                        isPlayable={!!activeDeckId && !isDeckFull}
                                    />
                                    {count > 0 && (
                                        <View style={styles.countBadge}>
                                            <Text style={styles.countBadgeText}>{count}</Text>
                                        </View>
                                    )}
                                </Animated.View>
                            );
                        }}
                        contentContainerStyle={styles.vaultList}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Vertical Void Line */}
                <View style={styles.voidLine} />

                {/* 3. THE CONSTRUCT (Right Pillar - 30%) */}
                <View style={styles.essencePillar}>
                    <View style={styles.pillarHeader}>
                        <View style={styles.deckSwitchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pillarTitle}>CONSTRUCT</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.pillarCount, isDeckFull && { color: colors.error }]}>
                                        {activeDeck ? `${activeDeck.cards.length}/25 ESSENCES` : 'UNLINKED'}
                                    </Text>
                                    {activeDeck && (
                                        <Pressable
                                            onPress={() => deleteDeck(activeDeck.id)}
                                            hitSlop={8}
                                        >
                                            <Text style={styles.deleteDeckText}>✕</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            <Pressable onPress={handleCreateDeck} style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>+</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Deck Selector Strip (if multiple decks exist) */}
                    {decks.length > 1 && (
                        <View style={styles.deckSelectorContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckSelectorList}>
                                {decks.map(d => (
                                    <Pressable
                                        key={d.id}
                                        onPress={() => setActiveDeck(d.id)}
                                        style={[styles.deckTab, d.id === activeDeckId && styles.deckTabActive]}
                                    >
                                        <Text style={[styles.deckTabText, d.id === activeDeckId && styles.deckTabTextActive]}>
                                            {d.name.split(' ')[1] || '•'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {!activeDeck ? (
                        <View style={styles.emptyEssence}>
                            <Text style={styles.emptyText}>UNLINKED</Text>
                            <Pressable onPress={handleCreateDeck} style={styles.forgeBtn}>
                                <Text style={styles.forgeBtnText}>FORGE LINK</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <FlatList
                            data={activeDeck.cards}
                            keyExtractor={(item, i) => `${item.id}-${i}`}
                            renderItem={({ item, index }) => (
                                <DeckCardRow
                                    card={item}
                                    index={index}
                                    onRemove={() => removeCardFromDeck(activeDeckId!, item.id)}
                                />
                            )}
                            ListHeaderComponent={<View style={{ height: 5 }} />}
                            contentContainerStyle={styles.essenceList}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    layout: {
        flex: 1,
        flexDirection: 'row',
    },
    voidLine: {
        width: 1,
        backgroundColor: 'rgba(16,185,129,0.15)',
        marginVertical: 20,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },

    // --- Sigil Pillar ---
    sigilPillar: {
        width: '15%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        fontSize: 32,
        color: colors.arcane.emerald,
        fontFamily: 'serif',
    },
    sigilItem: {
        alignItems: 'center',
        marginVertical: 15,
    },
    sigilHex: {
        width: 44,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sigilHexActive: {
        borderColor: colors.arcane.emerald,
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    sigilIconText: {
        fontSize: 18,
        color: 'rgba(16,185,129,0.5)',
        transform: [{ rotate: '-45deg' }],
    },
    sigilTextActive: {
        color: colors.arcane.emerald,
    },
    sigilLabel: {
        fontSize: 8,
        color: 'rgba(16,185,129,0.5)',
        marginTop: 10,
        letterSpacing: 2,
        fontWeight: '900',
    },
    spacer: { flex: 1 },

    // --- Vault Pillar ---
    vaultPillar: {
    },
    pillarHeader: {
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.05)',
        marginBottom: 5,
    },
    deckSwitchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)',
    },
    actionIconText: {
        color: colors.arcane.emerald,
        fontSize: 18,
        fontWeight: '300',
    },
    deckSelectorContainer: {
        height: 35,
        marginBottom: 10,
    },
    deckSelectorList: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 15,
    },
    deckTab: {
        width: 26,
        height: 26,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    deckTabActive: {
        borderColor: colors.arcane.emerald,
        backgroundColor: 'rgba(16,185,129,0.15)',
    },
    deckTabText: {
        fontSize: 10,
        color: 'rgba(16,185,129,0.4)',
        transform: [{ rotate: '-45deg' }],
        fontWeight: '900',
    },
    deckTabTextActive: {
        color: colors.arcane.emerald,
    },
    pillarTitle: {
        fontSize: 14,
        color: colors.arcane.white,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: 'serif',
    },
    pillarCount: {
        fontSize: 8,
        color: colors.arcane.emerald,
        letterSpacing: 1,
        opacity: 0.6,
    },
    vaultList: {
        paddingBottom: 20,
    },
    vaultCardWrapper: {
        padding: 5,
        position: 'relative',
    },
    countBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.arcane.emerald,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    countBadgeText: {
        fontSize: 10,
        color: '#000',
        fontWeight: '900',
    },

    // --- Construct Pillar ---
    essencePillar: {
        flex: 0.25,
        paddingHorizontal: 10,
    },
    essenceList: {
        paddingBottom: 20,
    },
    deckCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginBottom: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 2,
        borderLeftWidth: 1.5,
        borderLeftColor: colors.arcane.emerald,
    },
    deckCardMana: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(16,185,129,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    manaText: {
        fontSize: 10,
        color: colors.arcane.emerald,
        fontWeight: '900',
    },
    deckCardName: {
        flex: 1,
        fontSize: 10,
        color: colors.arcane.white,
        fontWeight: '700',
        letterSpacing: 1,
    },
    removeBtn: {
        padding: 5,
    },
    removeText: {
        color: colors.error,
        fontSize: 12,
        opacity: 0.6,
    },
    emptyEssence: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 5,
        marginBottom: 20,
    },
    forgeBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        backgroundColor: 'rgba(16,185,129,0.05)',
    },
    forgeBtnText: {
        color: colors.arcane.emerald,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    deleteDeckText: {
        fontSize: 10,
        color: colors.error,
        opacity: 0.5,
        fontWeight: '900',
    },
});
