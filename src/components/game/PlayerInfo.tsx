import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerType, Hero } from '../../types';
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
    hero?: Hero;
    onUseHeroAbility?: () => void;
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
    hero,
    onUseHeroAbility,
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
                    {hero?.artwork && (
                        <Image source={hero.artwork} style={styles.heroAvatar} />
                    )}
                    <View>
                        <View style={styles.nameRow}>
                            <Text variant="body" style={styles.name}>{hero?.name || name}</Text>
                            {isCurrentTurn && (
                                <View style={styles.turnIndicator}>
                                    <Text variant="caption" color={colors.secondary[400]}>TURN</Text>
                                </View>
                            )}
                        </View>
                        {hasPassed && (
                            <View style={styles.passedIndicator}>
                                <Text variant="caption" color={colors.warning}>PASSED</Text>
                            </View>
                        )}
                    </View>
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

                    {/* Hero Ability Button (Player Only) */}
                    {isPlayer && onUseHeroAbility && hero && (
                        <Pressable
                            onPress={onUseHeroAbility}
                            disabled={!isCurrentTurn || hero.ability.currentCooldown > 0}
                            style={({ pressed }) => [
                                styles.abilityButton,
                                (hero.ability.currentCooldown > 0) && styles.abilityDisabled,
                                pressed && styles.abilityPressed
                            ]}
                        >
                            <Text variant="caption" style={styles.abilityText}>
                                {hero.ability.currentCooldown > 0
                                    ? 'Used'
                                    : 'Leader'}
                            </Text>
                        </Pressable>
                    )}
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
    abilityButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: colors.primary[600],
        borderRadius: borderRadius.sm,
        marginLeft: spacing.xs,
        borderWidth: 1,
        borderColor: colors.primary[500],
    },
    abilityDisabled: {
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.secondary,
        opacity: 0.7,
    },
    abilityPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    abilityText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    heroAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.secondary,
        backgroundColor: colors.background.tertiary,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
