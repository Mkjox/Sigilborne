import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { RootStackParamList, RowType } from '../../types';
import { Text, Button } from '../../components/ui';
import { GameBoardComponent, PlayerHand, GameSoundController } from '../../components/game';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { useGameStore } from '../../store';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

export const GameBoardScreen: React.FC<Props> = ({ navigation, route }) => {
    const { difficulty } = route.params;
    const insets = useSafeAreaInsets();

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

    const handleRowPress = (row: RowType) => {
        if (selectedCardId) {
            playCard(selectedCardId, row);
        }
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
            <StatusBar barStyle="light-content" hidden />
            <GameSoundController />

            {/* Background gradient */}
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', '#050008']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Main game content */}
            <View style={[
                styles.content,
                {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                }
            ]}>
                {/* Top bar with menu button */}
                <Animated.View
                    entering={FadeIn.delay(200)}
                    style={styles.topBar}
                >
                    <Pressable
                        onPress={handleBackToMenu}
                        style={styles.menuButton}
                    >
                        <Text variant="bodySmall" color={colors.text.secondary}>☰ Menu</Text>
                    </Pressable>

                    <View style={styles.turnIndicator}>
                        <View style={[
                            styles.turnDot,
                            { backgroundColor: isPlayerTurn ? colors.success : colors.error }
                        ]} />
                        <Text variant="caption" color={colors.text.secondary}>
                            {isAIThinking ? 'AI Thinking...' : isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Game board */}
                <GameBoardComponent
                    onPassTurn={handlePassTurn}
                    onEndTurn={handleEndTurn}
                    onRowPress={handleRowPress}
                />

                {/* Player hand */}
                <Animated.View entering={SlideInUp.delay(300).springify()}>
                    <PlayerHand
                        cards={player.hand}
                        selectedCardId={selectedCardId}
                        onCardSelect={handleCardSelect}
                        onCardPlay={handleCardPlay}
                        playerMana={player.mana}
                        isPlayerTurn={isPlayerTurn}
                        hasPassed={player.hasPassed}
                    />
                </Animated.View>
            </View>

            {/* Game over overlay */}
            {gameOver && (
                <Animated.View
                    style={styles.gameOverOverlay}
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(300)}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.9)', 'rgba(10,0,21,0.95)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <Animated.View
                        style={styles.gameOverCard}
                        entering={SlideInDown.delay(200).springify()}
                    >
                        <LinearGradient
                            colors={winner === 'player'
                                ? [colors.secondary[600], colors.secondary[800]]
                                : ['rgba(239,68,68,0.3)', 'rgba(127,29,29,0.3)']
                            }
                            style={styles.gameOverGradient}
                        >
                            <Text variant="h1" style={[
                                styles.gameOverTitle,
                                winner === 'player' ? styles.victoryText : styles.defeatText,
                            ]}>
                                {winner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT'}
                            </Text>

                            <Text variant="body" color={colors.text.secondary} style={styles.gameOverSubtitle}>
                                {winner === 'player'
                                    ? 'You have defeated your opponent!'
                                    : 'Better luck next time...'}
                            </Text>

                            <View style={styles.gameOverButtons}>
                                <Pressable onPress={handlePlayAgain} style={styles.gameOverButtonPrimary}>
                                    <LinearGradient
                                        colors={[colors.primary[400], colors.primary[600]]}
                                        style={styles.gameOverButtonGradient}
                                    >
                                        <Text variant="button" color={colors.text.primary}>
                                            PLAY AGAIN
                                        </Text>
                                    </LinearGradient>
                                </Pressable>

                                <Pressable onPress={handleBackToMenu} style={styles.gameOverButtonSecondary}>
                                    <Text variant="button" color={colors.text.secondary}>
                                        MAIN MENU
                                    </Text>
                                </Pressable>
                            </View>
                        </LinearGradient>
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    menuButton: {
        padding: spacing.xs,
    },
    turnIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    turnDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    gameOverCard: {
        maxWidth: 350,
        width: '100%',
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gameOverGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    gameOverTitle: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    victoryText: {
        color: colors.secondary[300],
        textShadowColor: colors.secondary[500],
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
        marginBottom: spacing.lg,
    },
    gameOverButtons: {
        width: '100%',
        gap: spacing.sm,
    },
    gameOverButtonPrimary: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    gameOverButtonGradient: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
    },
    gameOverButtonSecondary: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
