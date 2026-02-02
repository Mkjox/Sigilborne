import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, FlatList, Animated as RNAnimated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInLeft, SlideInRight, SlideInDown, FadeOut } from 'react-native-reanimated';
import { RootStackParamList, Card, CardRarity, CardType } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getLayoutDimensions, getCardDimensions } from '../../theme';

import { useDeckStore } from '../../store/deckStore';
import { getAllCards } from '../../data/cardData';

type DeckBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckBuilder'>;

interface Props {
    navigation: DeckBuilderScreenNavigationProp;
}

const ALL_CARDS = getAllCards();

const DeckSlot: React.FC<{
    index: number;
    deck: any | null;
    isActive: boolean;
    onPress: () => void;
    onCreate?: () => void;
    width: number
}> = ({
    index,
    deck,
    isActive,
    onPress,
    onCreate,
    width
}) => (
        <Animated.View entering={SlideInLeft.delay(200 + index * 100).springify()}>
            <Pressable onPress={deck ? onPress : onCreate}>
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
                                {deck ? deck.name : 'Empty Slot'}
                            </Text>
                            <Text variant="caption" color={isActive ? 'rgba(255,255,255,0.7)' : colors.text.disabled}>
                                {deck ? `${deck.cards.length}/25 Cards` : 'Tap to Create'}
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
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Store
    const {
        decks,
        activeDeckId,
        createDeck,
        setActiveDeck,
        addCardToDeck,
        removeCardFromDeck
    } = useDeckStore();

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
        (selectedCategory === 'weather' && card.type === 'weather')
    );

    const categories = [
        { id: 'all', label: 'All Cards' },
        { id: 'units', label: 'Units' },
        { id: 'spells', label: 'Spells' },
        { id: 'weather', label: 'Weather' },
    ];

    const currentDeck = decks.find(d => d.id === activeDeckId);

    const handleCreateDeck = () => {
        const newId = createDeck(`My Deck ${decks.length + 1}`);
        setActiveDeck(newId);
    };


    const [lastTapInfo, setLastTapInfo] = useState({ id: '', time: 0 });

    const handleCardPress = (card: Card, evt: any) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;

        if (lastTapInfo.id === card.id && now - lastTapInfo.time < DOUBLE_PRESS_DELAY) {
            // Double tap detected!
            const { pageX, pageY } = evt.nativeEvent;
            triggerFlyAnimation(card, pageX, pageY);
            setLastTapInfo({ id: '', time: 0 }); // Reset
        } else {
            setLastTapInfo({ id: card.id, time: now });
        }
    };

    // Animation State
    const [flyingCards, setFlyingCards] = useState<{ id: string; card: Card; x: number; y: number }[]>([]);

    const triggerFlyAnimation = (card: Card, startX: number, startY: number) => {
        if (!activeDeckId) {
            // If no deck selected, select first one
            if (decks.length > 0) setActiveDeck(decks[0].id);
            else {
                // Or create one if none exist?
                const newId = createDeck(`My Deck 1`);
                setActiveDeck(newId);
            }
        }

        const flyId = Math.random().toString();
        setFlyingCards(prev => [...prev, { id: flyId, card, x: startX, y: startY }]);
    };

    const handleAnimationComplete = (flyId: string, card: Card) => {
        setFlyingCards(prev => prev.filter(fc => fc.id !== flyId));
        const currentActiveId = useDeckStore.getState().activeDeckId;
        if (currentActiveId) {
            addCardToDeck(currentActiveId, card);
        } else if (decks.length > 0) {
            addCardToDeck(decks[0].id, card);
        }
    };

    // Flying Card Component
    const FlyingCard = ({ item }: { item: { id: string; card: Card; x: number; y: number } }) => {
        const translateX = React.useRef(new RNAnimated.Value(item.x)).current;
        const translateY = React.useRef(new RNAnimated.Value(item.y)).current;
        const scale = React.useRef(new RNAnimated.Value(1)).current;
        const opacity = React.useRef(new RNAnimated.Value(1)).current;

        React.useEffect(() => {
            // Target position: Left panel (approx x=50, y=100)
            const targetX = 50;
            const targetY = 150;

            RNAnimated.parallel([
                RNAnimated.timing(translateX, {
                    toValue: targetX,
                    duration: 600,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(translateY, {
                    toValue: targetY,
                    duration: 600,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(scale, {
                    toValue: 0.2,
                    duration: 600,
                    useNativeDriver: true,
                }),
                RNAnimated.sequence([
                    RNAnimated.delay(400),
                    RNAnimated.timing(opacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ])
            ]).start(() => {
                handleAnimationComplete(item.id, item.card);
            });
        }, []);

        return (
            <RNAnimated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: gridCardWidth,
                    height: gridCardHeight,
                    zIndex: 1000,
                    transform: [
                        { translateX },
                        { translateY },
                        { scale }
                    ],
                    opacity
                }}
            >
                <CardComponent
                    card={item.card}
                    width={gridCardWidth}
                    height={gridCardHeight}
                    isPlayable={false}
                />
            </RNAnimated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', colors.background.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Flying Cards Layer */}
            {flyingCards.map(fc => (
                <FlyingCard key={fc.id} item={fc} />
            ))}

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
                            {/* Fixed 4 slots for decks */}
                            {[0, 1, 2, 3].map((index) => {
                                const deck = decks[index];
                                return (
                                    <DeckSlot
                                        key={index}
                                        index={index}
                                        deck={deck}
                                        isActive={deck && activeDeckId === deck.id}
                                        onPress={() => setActiveDeck(deck.id)}
                                        onCreate={handleCreateDeck}
                                        width={layout.leftPanelWidth - (layout.contentPadding * 2)}
                                    />
                                );
                            })}
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
                            renderItem={({ item }) => {
                                const countInDeck = currentDeck?.cards.filter(c => c.name === item.name).length || 0;

                                return (
                                    <View style={{ marginBottom: 10 }}>
                                        <CardComponent
                                            card={item}
                                            width={gridCardWidth}
                                            height={gridCardHeight}
                                            isPlayable={false}
                                            onPress={(evt) => handleCardPress(item, evt)}
                                        />
                                        {countInDeck > 0 && (
                                            <View style={styles.countBadge}>
                                                <Text variant="caption" color="#fff" style={{ fontWeight: 'bold' }}>
                                                    {countInDeck}/2
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            }}
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
    },
    countBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: colors.primary[500],
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background.primary,
        zIndex: 10,
    }
});
