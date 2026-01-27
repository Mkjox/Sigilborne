import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, Layout } from 'react-native-reanimated';
import { Card } from '../../types';
import { CardComponent } from './CardComponent';
import { Text } from '../ui';
import { colors, spacing, getCardDimensions } from '../../theme';

interface PlayerHandProps {
    cards: Card[];
    selectedCardId: string | null;
    onCardSelect: (cardId: string) => void;
    onCardPlay: (cardId: string) => void;
    playerMana: number;
    isPlayerTurn: boolean;
    hasPassed: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    cards,
    selectedCardId,
    onCardSelect,
    onCardPlay,
    playerMana,
    isPlayerTurn,
    hasPassed,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const cardDims = getCardDimensions(screenWidth, screenHeight);
    const handCardWidth = cardDims.width * 0.85;
    const handCardHeight = cardDims.height * 0.85;
    const containerHeight = handCardHeight + 30; // Card + header + hint

    const handleCardPress = (card: Card) => {
        if (!isPlayerTurn || hasPassed) return;

        if (selectedCardId === card.id) {
            // Double tap plays the card
            onCardPlay(card.id);
        } else {
            onCardSelect(card.id);
        }
    };

    if (cards.length === 0) {
        return (
            <View style={styles.emptyHand}>
                <Text variant="body" color={colors.text.tertiary}>
                    No cards in hand
                </Text>
            </View>
        );
    }

    return (
        <Animated.View
            style={[styles.container, { maxHeight: containerHeight }]}
            entering={SlideInDown.duration(500)}
        >
            <View style={styles.header}>
                <Text variant="caption" color={colors.text.secondary}>
                    Your Hand ({cards.length})
                </Text>
                {hasPassed && (
                    <Text variant="caption" color={colors.warning}>
                        PASSED
                    </Text>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {cards.map((card, index) => {
                    const isPlayable = isPlayerTurn && !hasPassed && card.manaCost <= playerMana;
                    const isSelected = selectedCardId === card.id;

                    return (
                        <Animated.View
                            key={card.id}
                            entering={FadeIn.delay(index * 50)}
                            exiting={FadeOut.duration(200)}
                            layout={Layout.springify()}
                            style={styles.cardWrapper}
                        >
                            <CardComponent
                                card={card}
                                onPress={() => handleCardPress(card)}
                                isSelected={isSelected}
                                isPlayable={isPlayable}
                                width={handCardWidth}
                                height={handCardHeight}
                            />
                        </Animated.View>
                    );
                })}
            </ScrollView>

            {selectedCardId && (
                <Animated.View
                    style={styles.hint}
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                >
                    <Text variant="caption" color={colors.text.secondary}>
                        Tap again to play
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(20, 20, 32, 0.9)',
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        marginBottom: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
    },
    cardWrapper: {
        marginHorizontal: 1,
    },
    emptyHand: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 20, 32, 0.9)',
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
    },
    hint: {
        alignItems: 'center',
        paddingTop: 2,
    },
});
