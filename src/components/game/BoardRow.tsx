import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, RowType } from '../../types';
import { CardComponent } from './CardComponent';
import { Text } from '../ui';
import { colors, spacing, borderRadius, getCardDimensions } from '../../theme';

interface BoardRowProps {
    row: RowType;
    cards: Card[];
    power: number;
    isPlayer: boolean;
    hasWeather: boolean;
    onPress?: (row: RowType) => void;
}

const rowIcons: Record<RowType, string> = {
    melee: '⚔️',
    ranged: '🏹',
    siege: '💥',
};

const rowLabels: Record<RowType, string> = {
    melee: 'Melee',
    ranged: 'Ranged',
    siege: 'Siege',
};

export const BoardRow: React.FC<BoardRowProps> = ({
    row,
    cards,
    power,
    isPlayer,
    hasWeather,
    onPress,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const cardDims = getCardDimensions(screenWidth, screenHeight);
    const rowCardWidth = cardDims.width * 0.55;
    const rowCardHeight = cardDims.height * 0.55;
    const rowHeight = rowCardHeight + 8; // Card height + padding
    return (
        <Pressable
            style={[styles.container, !isPlayer && styles.enemyRow, { minHeight: rowHeight }]}
            onPress={() => onPress?.(row)}
            disabled={!onPress}
        >
            {/* Row label and power */}
            <View style={styles.labelContainer}>
                <Text variant="caption" style={styles.rowIcon}>{rowIcons[row]}</Text>
                <Text variant="caption" color={colors.text.tertiary}>
                    {rowLabels[row]}
                </Text>
            </View>

            {/* Power display */}
            <View style={[styles.powerContainer, hasWeather && styles.weatherPower]}>
                <Text variant="h3" style={styles.powerText}>{power}</Text>
            </View>

            {/* Cards area */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsContent}
                style={[styles.cardsArea, { maxHeight: rowCardHeight + 4 }]}
            >
                {cards.length === 0 ? (
                    <View style={styles.emptyRow}>
                        <Text variant="caption" color={colors.text.disabled}>
                            Empty
                        </Text>
                    </View>
                ) : (
                    cards.map((card, index) => (
                        <Animated.View
                            key={card.id}
                            entering={FadeIn.delay(index * 30)}
                            layout={Layout.springify()}
                            style={styles.cardWrapper}
                        >
                            <CardComponent
                                card={card}
                                isPlayable={false}
                                width={rowCardWidth}
                                height={rowCardHeight}
                            />
                        </Animated.View>
                    ))
                )}
            </ScrollView>

            {/* Weather overlay */}
            {hasWeather && (
                <LinearGradient
                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                    style={styles.weatherOverlay}
                    pointerEvents="none"
                />
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 46, 0.6)',
        borderRadius: borderRadius.sm,
        marginVertical: 1,
        paddingVertical: 2,
        paddingHorizontal: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    enemyRow: {
        backgroundColor: 'rgba(46, 30, 30, 0.6)',
    },
    labelContainer: {
        width: 36,
        alignItems: 'center',
    },
    rowIcon: {
        fontSize: 12,
        marginBottom: 1,
    },
    powerContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary[700],
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.xs,
    },
    weatherPower: {
        backgroundColor: colors.accent[700],
    },
    powerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    cardsArea: {
        flex: 1,
    },
    cardsContent: {
        paddingVertical: 2,
        gap: 2,
    },
    cardWrapper: {
        marginHorizontal: 1,
    },
    emptyRow: {
        flex: 1,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weatherOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.sm,
    },
});
