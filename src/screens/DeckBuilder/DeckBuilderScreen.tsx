import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ScrollView,
    useWindowDimensions,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInUp,
    FadeInLeft,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    FadeOut,
    ZoomIn,
    ZoomOut,
} from 'react-native-reanimated';
import { RootStackParamList, Card, CardType } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useDeckStore } from '../../store/deckStore';
import { useCampaignStore } from '../../store/campaignStore';
import { getAllCards, AVAILABLE_HEROES } from '../../data/cardData';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;
interface Props { navigation: DeckBuilderScreenNavigationProp; }

const ALL_CARDS = getAllCards();

type ValidFaction = 'order' | 'shadow' | 'nature' | 'arcane' | 'neutral';

const FactionSymbols: Record<ValidFaction, { icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }> = {
    order: { icon: 'shield-sun', color: '#ffd700' }, // Gold Shield
    shadow: { icon: 'moon-waning-crescent', color: '#a855f7' }, // Purple Moon
    nature: { icon: 'leaf', color: '#10b981' }, // Emerald Leaf
    arcane: { icon: 'star-four-points-outline', color: '#06b6d4' }, // Cyan Star
    neutral: { icon: 'scale-balance', color: '#9ca3af' }, // Silver Scales
};

// --- Components ---

const SigilIcon = ({ active, label, onPress, icon }: { active: boolean; label: string; onPress: () => void; icon: string }) => {
    return (
        <Pressable onPress={onPress} style={styles.sigilItem}>
            <View style={[styles.sigilHex, active && styles.sigilHexActive]}>
                <Text style={[styles.sigilIconText, active && styles.sigilTextActive]}>{icon}</Text>
            </View>
            <Text
                style={[styles.sigilLabel, active && styles.sigilTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {label}
            </Text>
        </Pressable>
    );
};

const DeckCardRow = ({ card, onRemove, index, disabled }: { card: Card; onRemove: () => void; index: number; disabled?: boolean }) => {
    const { t } = useTranslation();
    return (
        <Animated.View entering={FadeInRight.delay(index * 20)} style={styles.deckCardRow}>
            <View style={styles.deckCardMana}>
                <Text style={styles.manaText}>{card.manaCost}</Text>
            </View>
            <Text style={styles.deckCardName} numberOfLines={1}>{t(`cards.${card.name}`).toUpperCase()}</Text>
            {!disabled && (
                <Pressable onPress={onRemove} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕</Text>
                </Pressable>
            )}
        </Animated.View>
    );
};

export const DeckBuilderScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { width: sw, height: sh } = useWindowDimensions();
    const {
        decks, activeDeckId,
        addCardToDeck: addToDeck, removeCardFromDeck: removeFromDeck, createDeck, deleteDeck, setActiveDeck, setDeckHero,
    } = useDeckStore();

    const { runActive, currentNodeId } = useCampaignStore();
    
    // The deck is never locked
    const isDeckLocked = false;

    const handleAddCard = (card: Card) => {
        if (isDeckLocked) return;
        if (activeDeckId) addToDeck(activeDeckId, card);
    };

    const handleRemoveCard = (deckId: string, cardId: string) => {
        if (isDeckLocked) return;
        removeFromDeck(deckId, cardId);
    };

    const handleSetHero = (deckId: string, heroId: string) => {
        if (isDeckLocked) return;
        setDeckHero(deckId, heroId);
    };

    const [filter, setFilter] = useState<'all' | CardType | 'hero'>('hero');
    const [libWidth, setLibWidth] = useState(0);
    const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);

    const activeDeck = useMemo(() => decks.find(d => d.id === activeDeckId), [decks, activeDeckId]);
    const filteredCards = useMemo(() => {
        if (filter === 'hero') return []; // Heroes are handled separately
        if (filter === 'all') return ALL_CARDS;
        return ALL_CARDS.filter(c => c.type === filter);
    }, [filter]);

    const activeHero = useMemo(() => {
        if (!activeDeck) return null;
        return AVAILABLE_HEROES.find(h => h.id === activeDeck.heroId) || null;
    }, [activeDeck]);

    const cardCountInDeck = (cardId: string) => {
        if (!activeDeck) return 0;
        const cardName = ALL_CARDS.find(c => c.id === cardId)?.name;
        return activeDeck.cards.filter(c => c.name === cardName).length;
    };

    const handleCreateDeck = () => {
        if (isDeckLocked) return;
        let nextNum = 1;
        while (decks.some(d => d.name === t('deck_builder.default_deck_name', { num: nextNum }))) {
            nextNum++;
        }
        const id = createDeck(t('deck_builder.default_deck_name', { num: nextNum }));
        setActiveDeck(id);
    };

    const handleDeleteDeck = (deckId: string) => {
        if (isDeckLocked) return;
        Alert.alert(
            t('deck_builder.delete_confirm_title'),
            t('deck_builder.delete_confirm_desc'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        deleteDeck(deckId);
                        const remaining = decks.filter(d => d.id !== deckId);
                        if (remaining.length > 0) {
                            setActiveDeck(remaining[0].id);
                        } else {
                            setActiveDeck(null);
                        }
                    },
                },
            ]
        );
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
                {isDeckLocked && (
                    <Animated.View entering={FadeInUp} style={styles.lockedBanner}>
                        <MaterialCommunityIcons name="lock" size={16} color={colors.arcane.white} />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.lockedTitle}>{t('deck_builder.deck_locked_title')}</Text>
                            <Text style={styles.lockedDesc}>{t('deck_builder.deck_locked_desc')}</Text>
                        </View>
                    </Animated.View>
                )}

                {/* 1. THE SIGILS (Left Pillar) */}
                <View style={styles.sigilPillar}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>‹</Text>
                    </Pressable>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1, width: '100%' }}
                        contentContainerStyle={styles.sigilScrollContent}
                    >
                        <SigilIcon active={filter === 'hero'} label={t('deck_builder.filters.hero')} icon="♆" onPress={() => setFilter('hero')} />
                        <SigilIcon active={filter === 'all'} label={t('deck_builder.filters.all')} icon="◈" onPress={() => setFilter('all')} />
                        <SigilIcon active={filter === 'unit'} label={t('deck_builder.filters.unit')} icon="⚔" onPress={() => setFilter('unit')} />
                        <SigilIcon active={filter === 'spell'} label={t('deck_builder.filters.spell')} icon="🝧" onPress={() => setFilter('spell')} />
                    </ScrollView>
                </View>

                {/* Vertical Void Line */}
                <View style={styles.voidLine} />

                {/* 2. THE VAULT (Center Pillar) */}
                <View style={[styles.vaultPillar, { flex: 0.75 }]} onLayout={(e) => setLibWidth(e.nativeEvent.layout.width)}>
                    <View style={styles.pillarHeader}>
                        <Text style={styles.pillarTitle}>{t('deck_builder.vault_title')}</Text>
                        <Text style={styles.pillarCount}>
                            {filter === 'hero' ? t('deck_builder.hero_count', { count: AVAILABLE_HEROES.length }) : t('deck_builder.essence_count', { count: filteredCards.length })}
                        </Text>
                    </View>

                    {filter === 'hero' ? (
                        <FlatList
                            key="hero-list"
                            data={AVAILABLE_HEROES}
                            numColumns={3}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => {
                                const isSelected = activeDeck?.heroId === item.id;
                                return (
                                    <View style={styles.vaultCardWrapper}>
                                        <Pressable
                                            style={[styles.heroCardPreview, isSelected && styles.heroCardPreviewSelected, isDeckLocked && { opacity: 0.8 }]}
                                            onPress={() => activeDeckId && handleSetHero(activeDeckId, item.id)}
                                        >
                                            <Image source={item.artwork} style={styles.heroArtwork} />
                                            {isSelected && <View style={styles.heroSelectedOverlay} />}
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroGradient} />

                                            <Text style={styles.heroClassName}>{t(`hero_classes.${item.className}`).toUpperCase()}</Text>

                                            {item.faction && FactionSymbols[item.faction as ValidFaction] && (
                                                <View style={[styles.heroFactionBadge, { borderColor: FactionSymbols[item.faction as ValidFaction].color }]}>
                                                    <MaterialCommunityIcons
                                                        name={FactionSymbols[item.faction as ValidFaction].icon}
                                                        size={14}
                                                        color={FactionSymbols[item.faction as ValidFaction].color}
                                                    />
                                                </View>
                                            )}

                                            <Text style={styles.heroNameTitle} numberOfLines={1}>{t(`cards.${item.name}`).toUpperCase()}</Text>

                                            <View style={styles.heroAbilityStrip}>
                                                <Text style={styles.heroAbilityIconText}>⚡</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.heroAbilityNameText} numberOfLines={1}>{t(`abilities.${item.ability.id}.name`)}</Text>
                                                    <Text style={styles.heroAbilityDescText} numberOfLines={2}>{t(`abilities.${item.ability.id}.desc`)}</Text>
                                                </View>
                                            </View>
                                        </Pressable>
                                        {/* Selection is indicated by the border and scale in heroCardPreviewSelected */}
                                    </View>
                                );
                            }}
                            contentContainerStyle={styles.vaultList}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <FlatList
                            data={filteredCards}
                            numColumns={4}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.vaultList}
                            showsVerticalScrollIndicator={false}
                            windowSize={5}
                            initialNumToRender={12}
                            maxToRenderPerBatch={10}
                            removeClippedSubviews={true}
                            renderItem={({ item }) => {
                                const count = cardCountInDeck(item.id);
                                const isMaxCopies = count >= 2;
                                const isFactionValid = !item.faction || item.faction === 'neutral' || !activeHero || item.faction === activeHero.faction;
                                const isLinkable = !!activeDeckId && !isDeckFull && !isMaxCopies && isFactionValid;

                                return (
                                    <View style={styles.vaultCardWrapper}>
                                        <CardComponent
                                            card={item}
                                            width={cardW}
                                            height={cardH}
                                            onPress={isLinkable && !isDeckLocked ? () => handleAddCard(item) : undefined}
                                            onInfoPress={() => setSelectedDetailCard(item)}
                                            isPlayable={isLinkable && !isDeckLocked}
                                        />
                                        {count > 0 && (
                                            <View style={styles.countBadge}>
                                                <Text style={styles.countBadgeText}>{count}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            }}
                        />
                    )}
                </View>

                {/* 3. THE CONSTRUCT (Right Pillar) */}
                <View style={styles.essencePillar}>
                    <View style={styles.pillarHeader}>
                        <View style={styles.deckSwitchRow}>
                            <Text style={styles.pillarTitle}>{activeDeck ? activeDeck.name.toUpperCase() : t('deck_builder.active_hero').toUpperCase()}</Text>
                            <View style={styles.spacer} />
                            {activeDeck && (
                                <Pressable 
                                    onPress={() => handleDeleteDeck(activeDeck.id)} 
                                    style={[styles.deleteActionIcon, { marginRight: 8 }, isDeckLocked && { opacity: 0.3 }]}
                                    disabled={isDeckLocked}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                                </Pressable>
                            )}
                            <Pressable 
                                onPress={handleCreateDeck} 
                                style={[styles.actionIcon, isDeckLocked && { opacity: 0.3 }]}
                                disabled={isDeckLocked}
                            >
                                <Text style={styles.actionIconText}>+</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.pillarCount}>
                            {activeDeck ? t('deck_builder.deck_count', { count: activeDeck.cards.length }) : t('deck_builder.unlinked').toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.deckSelectorContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckSelectorList}>
                            {decks.map((deck) => (
                                <Pressable
                                    key={deck.id}
                                    onPress={() => !isDeckLocked && setActiveDeck(deck.id)}
                                    style={[
                                        styles.deckTab, 
                                        activeDeckId === deck.id && styles.deckTabActive,
                                        isDeckLocked && activeDeckId !== deck.id && { opacity: 0.3 }
                                    ]}
                                >
                                    <Text style={[styles.deckTabText, activeDeckId === deck.id && styles.deckTabTextActive]}>
                                        {deck.name.substring(deck.name.length - 1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {activeDeck ? (
                        <>
                            <View style={styles.deckHeroStrip}>
                                <View style={styles.deckHeroStripInner}>
                                    <Text style={styles.deckHeroStripLabel}>{t('deck_builder.active_hero').toUpperCase()}</Text>
                                    <Text style={styles.deckHeroStripName}>{activeHero ? t(`cards.${activeHero.name}`).toUpperCase() : '???'}</Text>
                                    {activeHero && (
                                        <View style={{ height: 4 }} />
                                    )}
                                </View>
                            </View>

                            <FlatList
                                data={activeDeck.cards}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                renderItem={({ item, index }) => (
                                    <DeckCardRow
                                        card={item}
                                        index={index}
                                        onRemove={() => handleRemoveCard(activeDeck.id, item.id)}
                                        disabled={isDeckLocked}
                                    />
                                )}
                                contentContainerStyle={styles.essenceList}
                                showsVerticalScrollIndicator={false}
                            />


                        </>
                    ) : (
                        <View style={styles.emptyEssence}>
                            <Text style={styles.emptyText}>{t('deck_builder.unlinked').toUpperCase()}</Text>
                            <Pressable style={styles.forgeBtn} onPress={handleCreateDeck}>
                                <Text style={styles.forgeBtnText}>{t('deck_builder.forge_link').toUpperCase()}</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>

            {/* Card Detail Modal */}
            <Modal
                visible={!!selectedDetailCard}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedDetailCard(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedDetailCard(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                entering={ZoomIn}
                                exiting={ZoomOut}
                                style={styles.detailModal}
                            >
                                {selectedDetailCard && (
                                    <>
                                        <View style={styles.detailHeader}>
                                            <Text style={styles.detailName}>{t(`cards.${selectedDetailCard.name}`).toUpperCase()}</Text>
                                            <Text style={styles.detailType}>{t(`common.rarities.${selectedDetailCard.rarity}`).toUpperCase()} • {selectedDetailCard.type.toUpperCase()}</Text>
                                        </View>

                                        <View style={styles.detailContent}>
                                            <Text style={styles.detailDesc}>{t(selectedDetailCard.description)}</Text>
                                            {selectedDetailCard.flavorText && (
                                                <Text style={styles.detailFlavor}>"{t(selectedDetailCard.flavorText)}"</Text>
                                            )}
                                        </View>

                                        <View style={styles.detailStats}>
                                            <View style={styles.detailStatItem}>
                                                <Text style={styles.detailStatValue}>{selectedDetailCard.manaCost}</Text>
                                                <Text style={styles.detailStatLabel}>MANA</Text>
                                            </View>
                                            {selectedDetailCard.power > 0 && (
                                                <View style={styles.detailStatItem}>
                                                    <Text style={styles.detailStatValue}>{selectedDetailCard.power}</Text>
                                                    <Text style={styles.detailStatLabel}>POWER</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Pressable style={styles.closeModalBtn} onPress={() => setSelectedDetailCard(null)}>
                                            <Text style={styles.closeModalText}>{t('common.back').toUpperCase()}</Text>
                                        </Pressable>
                                    </>
                                )}
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        backgroundColor: 'rgba(16,185,129,0.1)',
        marginVertical: 20,
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
    sigilScrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    sigilItem: {
        alignItems: 'center',
        marginVertical: 10,
    },
    sigilHex: {
        width: 38,
        height: 38,
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
        fontSize: 16,
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
        letterSpacing: 1,
        fontWeight: '900',
        textAlign: 'center',
        width: '100%',
        paddingHorizontal: 4,
    },
    spacer: { flex: 1 },

    // --- Vault Pillar ---
    vaultPillar: {},
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
    deleteActionIcon: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(211,95,95,0.3)',
        backgroundColor: 'rgba(211,95,95,0.05)',
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


    // --- Hero Select Styles ---
    heroCardPreview: {
        width: 140,
        height: 220,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: colors.arcane.obsidian,
    },
    heroCardPreviewSelected: {
        borderColor: colors.arcane.emerald,
        borderWidth: 2,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ scale: 1.05 }],
    },
    heroArtwork: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    heroSelectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16,185,129,0.15)',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
    },
    heroClassName: {
        position: 'absolute',
        top: 8,
        left: 8,
        fontSize: 9,
        color: colors.arcane.cyan,
        fontWeight: '900',
        letterSpacing: 1.5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    heroFactionBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroNameTitle: {
        position: 'absolute',
        bottom: 65,
        left: 10,
        right: 10,
        fontSize: 14,
        color: colors.arcane.white,
        fontFamily: 'serif',
        fontWeight: '900',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroAbilityStrip: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
    },
    heroAbilityIconText: {
        fontSize: 10,
        marginRight: 6,
    },
    heroAbilityNameText: {
        fontSize: 9,
        color: colors.arcane.emerald,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    heroAbilityDescText: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
        lineHeight: 10,
    },
    deckHeroStrip: {
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 10,
    },
    deckHeroStripInner: {
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        padding: 8,
        borderRadius: 2,
    },
    deckHeroStripLabel: {
        fontSize: 7,
        color: colors.arcane.cyan,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 2,
    },
    deckHeroStripName: {
        fontSize: 12,
        color: colors.arcane.white,
        fontFamily: 'serif',
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },


    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    detailModal: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: colors.arcane.obsidian,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        padding: 24,
        borderRadius: 4,
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    detailHeader: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.2)',
        paddingBottom: 15,
        marginBottom: 20,
    },
    detailName: {
        fontSize: 24,
        color: colors.arcane.white,
        fontFamily: 'serif',
        fontWeight: '900',
        letterSpacing: 2,
    },
    detailType: {
        fontSize: 10,
        color: colors.arcane.emerald,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 4,
    },
    detailContent: {
        marginBottom: 25,
    },
    detailDesc: {
        fontSize: 14,
        color: colors.arcane.white,
        lineHeight: 22,
        marginBottom: 15,
    },
    detailFlavor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    detailStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 30,
    },
    detailStatItem: {
        alignItems: 'center',
    },
    detailStatValue: {
        fontSize: 28,
        color: colors.arcane.white,
        fontWeight: '900',
        fontFamily: 'serif',
    },
    detailStatLabel: {
        fontSize: 9,
        color: colors.arcane.cyan,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 4,
    },
    closeModalBtn: {
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.05)',
    },
    closeModalText: {
        color: colors.arcane.emerald,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 3,
    },
    lockedBanner: {
        position: 'absolute',
        top: 20,
        left: '20%',
        right: '20%',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: colors.error,
        padding: 12,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
    },
    lockedTitle: {
        color: colors.arcane.white,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    lockedDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 2,
    }
});
