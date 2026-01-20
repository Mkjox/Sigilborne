import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerType } from '../../types';
import { Text } from '../ui';
import { colors, spacing, borderRadius } from '../../theme';

interface PlayerInfoProps {
    playerType: PlayerType;
    roundsWon: number;
    totalPower: number;
    mana: number;
    maxMana: number;
    cardsInHand: number;
    cardsInDeck: number;
    hasPassed: boolean;
    isCurrentTurn: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
    playerType,
    roundsWon,
    totalPower,
    mana,
    maxMana,
    cardsInHand,
    cardsInDeck,
    hasPassed,
    isCurrentTurn,
}) => {
    const isPlayer = playerType === 'player';
    const name = isPlayer ? 'You' : 'Opponent';

    return (
        <Animated.View
            style={[
                styles.container,
                isCurrentTurn && styles.activeTurn,
                !isPlayer && styles.opponentContainer,
            ]}
            entering={isPlayer ? SlideInDown.duration(300) : FadeIn.duration(300)}
        >
            <LinearGradient
                colors={isPlayer
                    ? ['rgba(102, 0, 255, 0.2)', 'rgba(102, 0, 255, 0.05)']
                    : ['rgba(255, 50, 50, 0.2)', 'rgba(255, 50, 50, 0.05)']
                }
                style={styles.gradient}
            >
                {/* Name and turn indicator */}
                <View style={styles.header}>
                    <Text variant="body" style={styles.name}>{name}</Text>
                    {isCurrentTurn && (
                        <View style={styles.turnIndicator}>
                            <Text variant="caption" color={colors.secondary[400]}>TURN</Text>
                        </View>
                    )}
                    {hasPassed && (
                        <View style={styles.passedIndicator}>
                            <Text variant="caption" color={colors.warning}>PASSED</Text>
                        </View>
                    )}
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    {/* Rounds won */}
                    <View style={styles.stat}>
                        <Text variant="caption" color={colors.text.tertiary}>Rounds</Text>
                        <View style={styles.roundsContainer}>
                            {[0, 1].map(i => (
                                <View
                                    key={i}
                                    style={[
                                        styles.roundDot,
                                        i < roundsWon && styles.roundWon,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Total power */}
                    <View style={styles.stat}>
                        <Text variant="caption" color={colors.text.tertiary}>Power</Text>
                        <Text variant="h3" style={styles.powerValue}>{totalPower}</Text>
                    </View>

                    {/* Mana (only for player) */}
                    {isPlayer && (
                        <View style={styles.stat}>
                            <Text variant="caption" color={colors.text.tertiary}>Mana</Text>
                            <Text variant="body" color={colors.accent[400]}>
                                {mana}/{maxMana}
                            </Text>
                        </View>
                    )}

                    {/* Cards info */}
                    <View style={styles.stat}>
                        <Text variant="caption" color={colors.text.tertiary}>
                            {isPlayer ? 'Hand' : 'Cards'}
                        </Text>
                        <Text variant="body" color={colors.text.secondary}>
                            {cardsInHand}
                        </Text>
                    </View>

                    {/* Deck count */}
                    <View style={styles.stat}>
                        <Text variant="caption" color={colors.text.tertiary}>Deck</Text>
                        <Text variant="body" color={colors.text.secondary}>
                            {cardsInDeck}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        marginHorizontal: spacing.xs,
        marginVertical: 2,
        borderWidth: 1,
        borderColor: colors.border.secondary,
    },
    opponentContainer: {
        opacity: 0.9,
    },
    activeTurn: {
        borderColor: colors.secondary[500],
        borderWidth: 1,
    },
    gradient: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontWeight: 'bold',
        color: colors.text.primary,
        fontSize: 12,
    },
    turnIndicator: {
        marginLeft: spacing.xs,
        paddingHorizontal: spacing.xs,
        paddingVertical: 1,
        backgroundColor: colors.secondary[600],
        borderRadius: borderRadius.sm,
    },
    passedIndicator: {
        marginLeft: spacing.xs,
        paddingHorizontal: spacing.xs,
        paddingVertical: 1,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderRadius: borderRadius.sm,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    stat: {
        alignItems: 'center',
    },
    roundsContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 1,
    },
    roundDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    roundWon: {
        backgroundColor: colors.secondary[500],
        borderColor: colors.secondary[400],
    },
    powerValue: {
        color: colors.secondary[400],
        fontWeight: 'bold',
        fontSize: 14,
    },
});
