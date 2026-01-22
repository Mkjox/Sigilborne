import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RowType } from '../../types';
import { BoardRow } from './BoardRow';
import { PlayerInfo } from './PlayerInfo';
import { Text } from '../ui';
import { colors, spacing, borderRadius } from '../../theme';
import { useGameStore } from '../../store';

interface GameBoardComponentProps {
    onPassTurn: () => void;
    onEndTurn: () => void;
    onRowPress?: (row: RowType) => void;
}

export const GameBoardComponent: React.FC<GameBoardComponentProps> = ({
    onPassTurn,
    onEndTurn,
    onRowPress,
}) => {
    const {
        currentRound,
        roundsWon,
        currentTurn,
        player,
        ai,
        weather,
        isAIThinking,
        message,
        getPlayerPower,
        getAIPower,
        useHeroAbility,
    } = useGameStore();

    const playerPower = getPlayerPower();
    const aiPower = getAIPower();
    const isPlayerTurn = currentTurn === 'player' && !isAIThinking;

    return (
        <View style={styles.container}>
            {/* Round indicator */}
            <View style={styles.roundIndicator}>
                <Text variant="caption" color={colors.text.tertiary}>
                    Round {currentRound}/3
                </Text>
                <View style={styles.roundScore}>
                    <Text variant="body" color={colors.primary[400]}>
                        {roundsWon.player}
                    </Text>
                    <Text variant="body" color={colors.text.tertiary}> - </Text>
                    <Text variant="body" color={colors.error}>
                        {roundsWon.ai}
                    </Text>
                </View>
            </View>

            {/* Opponent info */}
            <PlayerInfo
                playerType="ai"
                roundsWon={roundsWon.ai}
                totalPower={aiPower}
                mana={ai.mana}
                maxMana={ai.maxMana}
                cardsInHand={ai.hand.length}
                cardsInDeck={ai.deck.length}
                hasPassed={ai.hasPassed}
                isCurrentTurn={currentTurn === 'ai'}
                hero={ai.hero}
            />

            {/* Board area */}
            <View style={styles.boardContainer}>
                {/* AI rows (top) */}
                <View style={styles.aiSide}>
                    <BoardRow
                        row="siege"
                        cards={ai.board.siege}
                        power={weather.siege ? ai.board.siege.length : ai.board.siege.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        hasWeather={weather.siege}
                    />
                    <BoardRow
                        row="ranged"
                        cards={ai.board.ranged}
                        power={weather.ranged ? ai.board.ranged.length : ai.board.ranged.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        hasWeather={weather.ranged}
                    />
                    <BoardRow
                        row="melee"
                        cards={ai.board.melee}
                        power={weather.melee ? ai.board.melee.length : ai.board.melee.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        hasWeather={weather.melee}
                    />
                </View>

                {/* Center divider */}
                <LinearGradient
                    colors={[colors.primary[700], colors.primary[500], colors.primary[700]]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.divider}
                >
                    <View style={styles.powerComparison}>
                        <Text variant="body" color={colors.text.primary} style={styles.powerLabel}>
                            {aiPower}
                        </Text>
                        <Text variant="caption" color={colors.text.tertiary}> vs </Text>
                        <Text variant="body" color={colors.text.primary} style={styles.powerLabel}>
                            {playerPower}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Player rows (bottom) */}
                <View style={styles.playerSide}>
                    <BoardRow
                        row="melee"
                        cards={player.board.melee}
                        power={weather.melee ? player.board.melee.length : player.board.melee.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        hasWeather={weather.melee}
                        onPress={onRowPress}
                    />
                    <BoardRow
                        row="ranged"
                        cards={player.board.ranged}
                        power={weather.ranged ? player.board.ranged.length : player.board.ranged.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        hasWeather={weather.ranged}
                        onPress={onRowPress}
                    />
                    <BoardRow
                        row="siege"
                        cards={player.board.siege}
                        power={weather.siege ? player.board.siege.length : player.board.siege.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        hasWeather={weather.siege}
                        onPress={onRowPress}
                    />
                </View>
            </View>

            {/* Player info */}
            <PlayerInfo
                playerType="player"
                roundsWon={roundsWon.player}
                totalPower={playerPower}
                mana={player.mana}
                maxMana={player.maxMana}
                cardsInHand={player.hand.length}
                cardsInDeck={player.deck.length}
                hasPassed={player.hasPassed}
                isCurrentTurn={currentTurn === 'player'}
                hero={player.hero}
                onUseHeroAbility={useHeroAbility}
            />

            {/* Action buttons */}
            <View style={styles.actions}>
                <Pressable
                    style={[styles.actionButton, !isPlayerTurn && styles.disabledButton]}
                    onPress={isPlayerTurn ? onPassTurn : undefined}
                    disabled={!isPlayerTurn || player.hasPassed}
                >
                    <Text variant="body" color={isPlayerTurn ? colors.warning : colors.text.disabled}>
                        Pass
                    </Text>
                </Pressable>

                {message && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={styles.messageContainer}
                    >
                        <Text variant="caption" color={colors.text.secondary}>
                            {message}
                        </Text>
                    </Animated.View>
                )}

                {isAIThinking && (
                    <View style={styles.thinkingContainer}>
                        <Text variant="caption" color={colors.accent[400]}>
                            AI thinking...
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    roundIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
    },
    roundScore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    boardContainer: {
        flex: 1,
        paddingHorizontal: 2,
    },
    aiSide: {
        flex: 1,
    },
    playerSide: {
        flex: 1,
    },
    divider: {
        height: 20,
        marginVertical: 2,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    powerComparison: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    powerLabel: {
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
    },
    actionButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    disabledButton: {
        opacity: 0.5,
    },
    messageContainer: {
        flex: 1,
        alignItems: 'center',
    },
    thinkingContainer: {
        paddingHorizontal: spacing.sm,
    },
});
