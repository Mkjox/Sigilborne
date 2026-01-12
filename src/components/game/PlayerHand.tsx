import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, Layout } from 'react-native-reanimated';
import { Card } from '../../types';
import { CardComponent } from './CardComponent';
import { Text } from '../ui';
import { colors, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
            style={styles.container}
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
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    scrollView: {
        maxHeight: 140,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    cardWrapper: {
        marginHorizontal: 2,
    },
    emptyHand: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 20, 32, 0.9)',
        borderTopWidth: 1,
        borderTopColor: colors.border.primary,
    },
    hint: {
        alignItems: 'center',
        paddingTop: spacing.xs,
    },
});
