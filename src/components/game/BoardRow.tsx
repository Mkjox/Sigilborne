import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, RowType } from '../../types';
import { CardComponent } from './CardComponent';
import { Text } from '../ui';
import { colors, spacing, borderRadius } from '../../theme';

interface BoardRowProps {
    row: RowType;
    cards: Card[];
    power: number;
    isPlayer: boolean;
    hasWeather: boolean;
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
}) => {
    return (
        <View style={[styles.container, !isPlayer && styles.enemyRow]}>
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
                style={styles.cardsArea}
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
                                isSmall
                                isPlayable={false}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 46, 0.6)',
        borderRadius: borderRadius.sm,
        marginVertical: 2,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        minHeight: 80,
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    enemyRow: {
        backgroundColor: 'rgba(46, 30, 30, 0.6)',
    },
    labelContainer: {
        width: 50,
        alignItems: 'center',
    },
    rowIcon: {
        fontSize: 16,
        marginBottom: 2,
    },
    powerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary[700],
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.sm,
    },
    weatherPower: {
        backgroundColor: colors.accent[700],
    },
    powerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    cardsArea: {
        flex: 1,
        maxHeight: 75,
    },
    cardsContent: {
        paddingVertical: spacing.xs,
        gap: spacing.xs,
    },
    cardWrapper: {
        marginHorizontal: 2,
    },
    emptyRow: {
        flex: 1,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weatherOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.sm,
    },
});
