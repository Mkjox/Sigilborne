import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { RootStackParamList, Difficulty } from '../../types';
import { AnimatedBackground, Text, Button } from '../../components/ui';
import { GameBoardComponent, PlayerHand } from '../../components/game';
import { colors, spacing, borderRadius } from '../../theme';
import { useGameStore } from '../../store';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

export const GameBoardScreen: React.FC<Props> = ({ navigation, route }) => {
    const { difficulty } = route.params;

    const {
        startGame,
        playCard,
        passTurn,
        resetGame,
        selectCard,
        player,
        currentTurn,
        gameOver,
        winner,
        isAIThinking,
        selectedCardId,
    } = useGameStore();

    // Start game on mount
    useEffect(() => {
        startGame(difficulty);

        return () => {
            // Clean up when leaving
        };
    }, [difficulty]);

    const handleCardSelect = (cardId: string) => {
        selectCard(cardId);
    };

    const handleCardPlay = (cardId: string) => {
        playCard(cardId);
    };

    const handlePassTurn = () => {
        passTurn();
    };

    const handleEndTurn = () => {
        // Auto end turn after playing card (handled in store)
    };

    const handlePlayAgain = () => {
        startGame(difficulty);
    };

    const handleBackToMenu = () => {
        resetGame();
        navigation.navigate('MainMenu');
    };

    const isPlayerTurn = currentTurn === 'player' && !isAIThinking;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <AnimatedBackground />

            {/* Main game content */}
            <View style={styles.content}>
                {/* Game board */}
                <GameBoardComponent
                    onPassTurn={handlePassTurn}
                    onEndTurn={handleEndTurn}
                />

                {/* Player hand */}
                <PlayerHand
                    cards={player.hand}
                    selectedCardId={selectedCardId}
                    onCardSelect={handleCardSelect}
                    onCardPlay={handleCardPlay}
                    playerMana={player.mana}
                    isPlayerTurn={isPlayerTurn}
                    hasPassed={player.hasPassed}
                />
            </View>

            {/* Game over overlay */}
            {gameOver && (
                <Animated.View
                    style={styles.gameOverOverlay}
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(300)}
                >
                    <Animated.View
                        style={styles.gameOverCard}
                        entering={SlideInDown.delay(200).springify()}
                    >
                        <Text variant="h1" style={[
                            styles.gameOverTitle,
                            winner === 'player' ? styles.victoryText : styles.defeatText,
                        ]}>
                            {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
                        </Text>

                        <Text variant="body" color={colors.text.secondary} style={styles.gameOverSubtitle}>
                            {winner === 'player'
                                ? 'You have defeated your opponent!'
                                : 'Better luck next time...'}
                        </Text>

                        <View style={styles.gameOverButtons}>
                            <Button
                                title="Play Again"
                                onPress={handlePlayAgain}
                                variant="primary"
                                style={styles.gameOverButton}
                            />
                            <Button
                                title="Main Menu"
                                onPress={handleBackToMenu}
                                variant="secondary"
                                style={styles.gameOverButton}
                            />
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
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
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    gameOverCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    gameOverTitle: {
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    victoryText: {
        color: colors.secondary[400],
        textShadowColor: colors.secondary[600],
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    defeatText: {
        color: colors.error,
        textShadowColor: 'rgba(239, 68, 68, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    gameOverSubtitle: {
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    gameOverButtons: {
        width: '100%',
        gap: spacing.md,
    },
    gameOverButton: {
        width: '100%',
    },
});
