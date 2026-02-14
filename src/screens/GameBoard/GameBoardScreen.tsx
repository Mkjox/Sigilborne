import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { RootStackParamList, Card } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, borderRadius, spacing } from '../../theme';
import { useGameStore } from '../../store';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

// Simple Background - Warm tones
const SimpleBackground: React.FC = () => {
    return (
        <LinearGradient
            colors={['#1A1410', '#2D2520', '#1A1410']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
        />
    );
};

// Single Board Zone Component
const BoardZone: React.FC<{
    cards: Card[];
    isPlayer: boolean;
    cardWidth: number;
    cardHeight: number;
    onPress?: () => void; // Zone press (for play)
    onCardPress?: (card: Card) => void; // Card press (for attack/details)
    isActive?: boolean;
    highlightedCardIds?: string[];
    selectedCardId?: string | null;
}> = ({ cards, isPlayer, cardWidth, cardHeight, onPress, onCardPress, isActive, highlightedCardIds = [], selectedCardId }) => {
    return (
        <Pressable
            style={[
                styles.boardZoneContainer,
                isActive && styles.activeBoardZone
            ]}
            onPress={onPress}
            // Only disable zone press if no handler. Children presses still work.
            disabled={!onPress}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.boardZoneContent}
            >
                {cards.map((card, index) => {
                    const isHighlighted = highlightedCardIds.includes(card.id);
                    const isSelected = selectedCardId === card.id;

                    return (
                        <Animated.View
                            key={`${card.id}-${index}`}
                            entering={FadeIn.delay(index * 100)}
                            exiting={FadeOut}
                            style={{
                                marginHorizontal: 4,
                                transform: [{ scale: isHighlighted ? 1.05 : 1 }],
                                opacity: (highlightedCardIds.length > 0 && !isHighlighted && !isSelected) ? 0.6 : 1,
                            }}
                        >
                            {/* Target indicator */}
                            {isHighlighted && !isPlayer && (
                                <View style={{
                                    position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center', zIndex: 10
                                }}>
                                    <Text style={{ fontSize: 20 }}>🎯</Text>
                                </View>
                            )}

                            <CardComponent
                                card={card}
                                width={cardWidth}
                                height={cardHeight}
                                isPlayable={true} // Allow interaction
                                hideStats={false}
                                isSelected={isSelected}
                                isTargeted={isHighlighted && !isPlayer} // Target highlighting
                                onPress={() => onCardPress?.(card)}
                            />
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </Pressable>
    );
};

export const GameBoardScreen: React.FC<Props> = ({ navigation, route }) => {
    const difficulty = route.params?.difficulty || 'medium';
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const {
        startGame, playCard, passTurn, resetGame, selectCard,
        player, ai, currentTurn, gameOver, winner, isAIThinking,
        selectedCardId, roundsWon, currentRound,
        getPlayerPower, getAIPower, useHeroAbility, message,
        attackingCardId, setAttackingCard, attackCard
    } = useGameStore();

    useEffect(() => { startGame(difficulty); }, [difficulty]);

    // Dimensions
    const sideColWidth = 90;
    const availableHeight = screenHeight - 60;

    // Board calculations
    // Two main zones + hand.
    const boardZoneHeight = availableHeight * 0.35;
    const cardHeight = Math.min(boardZoneHeight * 0.7, 110);
    const cardWidth = cardHeight * 0.72;

    const handCardH = Math.min(screenHeight * 0.25, 160);
    const handCardW = handCardH * 0.72;

    const shouldHighlightPass = currentTurn === 'player' && !isAIThinking && !player.hasPassed;
    const isPlayerTurn = currentTurn === 'player' && !isAIThinking;
    const playerPower = getPlayerPower();
    const aiPower = getAIPower();

    const handleCardPress = (card: Card) => {
        if (!isPlayerTurn || player.hasPassed) return;

        // If we are in attack mode, generally we shouldn't interact with hand, but maybe cancel attack?
        if (attackingCardId) {
            setAttackingCard(null);
            return;
        }

        if (selectedCardId === card.id) {
            // Play directly to board (no row selection needed)
            playCard(card.id);
        } else {
            selectCard(card.id);
        }
    };

    const handleBoardPress = () => {
        if (selectedCardId) {
            playCard(selectedCardId);
        } else if (attackingCardId) {
            // Tapping empty space cancels attack
            setAttackingCard(null);
        }
    };

    // Targeted Attack Logic
    const handleBoardCardPress = (card: Card, isPlayerSide: boolean) => {
        if (!isPlayerTurn) return;

        if (isPlayerSide) {
            // START ATTACK: Select player unit
            if (attackingCardId === card.id) {
                // Deselect
                setAttackingCard(null);
            } else {
                if (!card.isExhausted) {
                    setAttackingCard(card.id);
                } else {
                    // Maybe show message "Unit is exhausted"
                }
            }
        } else {
            // END ATTACK: Target enemy unit
            if (attackingCardId) {
                attackCard(card.id);
            }
        }
    };

    // Calculate highlights
    const validTargets = attackingCardId ? ai.board.map(c => c.id) : [];

    // Toast Component
    const Toast = () => {
        if (!message) return null;
        const isRoundResult = message.includes('Won Round') || message.includes('Draw');
        // also show attack messages temporarily
        const isAttackMsg = message.includes('Attack');

        if (!isRoundResult && !isAttackMsg) return null;

        return (
            <Animated.View
                entering={SlideInDown.springify()}
                exiting={FadeOut}
                style={styles.toastContainer}
            >
                <View style={styles.toastContent}>
                    <Text variant="h4" color={message.includes('You') || message === 'Victory!' ? colors.success : (message.includes('AI') || message === 'Defeat!' ? colors.error : colors.text.primary)}>
                        {message}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <BoardSurface style={styles.container}>
            <StatusBar hidden />

            {/* TOP HUD BAR */}
            <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
                {/* Left: Opponent Name */}
                <View style={styles.topBarLeft}>
                    <View style={styles.avatarMini}>
                        <Text style={{ fontSize: 18 }}>🤖</Text>
                    </View>
                    <View>
                        <Text variant="caption" color={colors.text.secondary} style={{ fontWeight: 'bold' }}>OPPONENT</Text>
                        <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 10 }}>The Innkeeper</Text>
                    </View>
                </View>

                {/* Center: Score */}
                <View style={styles.topBarCenter}>
                    <View style={styles.scoreContainer}>
                        <Text variant="h4" color={colors.error} style={styles.scoreText}>{roundsWon.ai}</Text>
                    </View>
                    <Text variant="caption" color={colors.text.tertiary} style={{ marginHorizontal: 8, fontSize: 12 }}>VS</Text>
                    <View style={[styles.scoreContainer, { borderColor: colors.primary[500] }]}>
                        <Text variant="h4" color={colors.primary[400]} style={styles.scoreText}>{roundsWon.player}</Text>
                    </View>
                </View>

                {/* Right: Menu */}
                <Pressable
                    onPress={() => { resetGame(); navigation.navigate('MainMenu'); }}
                    style={styles.menuBtn}
                >
                    <Text variant="caption" color={colors.text.disabled}>MENU</Text>
                </Pressable>
            </View>

            {/* MAIN CONTENT */}
            <View style={[styles.mainRow, { marginTop: 60, marginBottom: insets.bottom }]}>

                {/* LEFT COLUMN: Stats */}
                <View style={[styles.sideColumnLeft, { width: sideColWidth }]}>
                    <View style={styles.statDisplay}>
                        <Text variant="caption" color={colors.text.disabled} style={styles.statLabel}>HAND</Text>
                        <Text variant="h4" color={colors.text.primary}>{ai.hand.length}</Text>
                    </View>

                    <View style={[styles.statDisplay, { marginTop: 'auto' }]}>
                        <View style={[styles.powerBadge, { borderColor: colors.error }]}>
                            <Text variant="h3" color="#fff" style={styles.powerText}>{aiPower}</Text>
                        </View>
                        <Text variant="caption" color={colors.error} style={styles.statLabel}>POWER</Text>
                    </View>
                </View>

                {/* CENTER BOARD */}
                <View style={styles.boardArea}>
                    {/* AI ZONE */}
                    <View style={styles.boardHalf}>
                        <BoardZone
                            cards={ai.board}
                            isPlayer={false}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            onCardPress={(card) => handleBoardCardPress(card, false)}
                            highlightedCardIds={validTargets}
                        />
                    </View>

                    {/* DIVIDER */}
                    <View style={styles.boardDivider} />

                    {/* PLAYER ZONE */}
                    <View style={styles.boardHalf}>
                        <BoardZone
                            cards={player.board}
                            isPlayer={true}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            isActive={isPlayerTurn && !!selectedCardId}
                            onPress={handleBoardPress} // For playing cards to zone
                            onCardPress={(card) => handleBoardCardPress(card, true)}
                            selectedCardId={attackingCardId}
                        />
                    </View>
                </View>

                {/* RIGHT COLUMN: Player Actions */}
                <View style={[styles.sideColumnRight, { width: sideColWidth }]}>
                    <View style={[styles.statDisplay, { marginBottom: 'auto' }]}>
                        <View style={[styles.powerBadge, { borderColor: colors.primary[500], backgroundColor: 'rgba(212,175,55,0.2)' }]}>
                            <Text variant="h3" color={colors.primary[200]} style={styles.powerText}>{playerPower}</Text>
                        </View>
                        <Text variant="caption" color={colors.primary[400]} style={styles.statLabel}>POWER</Text>
                    </View>

                    <View style={styles.statDisplay}>
                        <View style={[styles.manaBadge]}>
                            <Text variant="h4" color="#fff" style={{ fontWeight: 'bold' }}>{player.mana}</Text>
                        </View>
                        <Text variant="caption" color={colors.accent[400]} style={styles.statLabel}>MANA</Text>
                    </View>

                    <Pressable
                        onPress={passTurn}
                        disabled={!isPlayerTurn || player.hasPassed}
                        style={({ pressed }) => [
                            styles.passButton,
                            pressed && { transform: [{ scale: 0.95 }] },
                            shouldHighlightPass && styles.passButtonHighlight,
                            player.hasPassed && styles.passButtonDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={player.hasPassed ? ['#4A2511', '#3E1F0E'] : ['#E8C547', '#B8941F']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.passButtonInner}>
                            <Text variant="button" color={player.hasPassed ? colors.text.disabled : '#3E1F0E'} style={{ fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>
                                {player.hasPassed ? "PASSED" : "END TURN"}
                            </Text>
                        </View>
                    </Pressable>
                </View>

            </View>

            {/* BOTTOM HAND ZONE */}
            <View
                style={[styles.handZone, { left: sideColWidth, right: sideColWidth, paddingBottom: insets.bottom + 10 }]}
                pointerEvents="box-none"
            >
                {player.hand.map((card, index) => {
                    const totalCards = player.hand.length;
                    const centerIndex = (totalCards - 1) / 2;
                    const rotate = (index - centerIndex) * 3;
                    const translateY = Math.abs(index - centerIndex) * 2;

                    return (
                        <Animated.View
                            key={card.id}
                            entering={SlideInDown.delay(index * 50)}
                            style={[
                                styles.handCardContainer,
                                {
                                    transform: [
                                        { rotate: `${rotate}deg` },
                                        { translateY: selectedCardId === card.id ? -30 : translateY }
                                    ],
                                    zIndex: selectedCardId === card.id ? 100 : index,
                                    marginLeft: index === 0 ? 0 : -40
                                }
                            ]}
                        >
                            <CardComponent
                                card={card}
                                width={handCardW}
                                height={handCardH}
                                isSelected={selectedCardId === card.id}
                                isPlayable={isPlayerTurn && !player.hasPassed && (card.manaCost ?? 0) <= player.mana}
                                onPress={() => handleCardPress(card)}
                            />
                        </Animated.View>
                    );
                })}
            </View>

            <Toast />

            {/* Game Over Overlay */}
            {gameOver && (
                <View style={styles.overlay}>
                    <View style={styles.overlayCard}>
                        <Text variant="h2" style={{ color: colors.text.primary, marginBottom: 20 }}>
                            {winner === 'player' ? 'VICTORY' : (winner === 'draw' ? 'DRAW' : 'DEFEAT')}
                        </Text>
                        <Pressable onPress={() => startGame(difficulty)} style={styles.overlayBtn}>
                            <Text variant="button" color="#FFFFFF">RETRY</Text>
                        </Pressable>
                        <Pressable onPress={() => { resetGame(); navigation.navigate('MainMenu'); }} style={[styles.overlayBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'white', marginTop: 10 }]}>
                            <Text variant="button" color={colors.text.primary}>EXIT</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </BoardSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    topBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 20,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topBarCenter: { flexDirection: 'row', alignItems: 'center' },
    menuBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 16 },
    mainRow: {
        flex: 1,
        flexDirection: 'row',
    },
    sideColumnLeft: {
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
    },
    sideColumnRight: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
        justifyContent: 'flex-end',
    },
    avatarMini: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary[700],
        alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 2, borderColor: colors.accent[500],
    },
    scoreContainer: {
        width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: colors.error,
    },
    scoreText: { fontSize: 14, fontWeight: 'bold', lineHeight: 18 },
    statDisplay: { alignItems: 'center', gap: 2, paddingVertical: 8 },
    powerBadge: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, marginBottom: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4,
    },
    manaBadge: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.accent[600], borderWidth: 2, borderColor: colors.accent[300], marginBottom: 4,
        shadowColor: colors.accent[500], shadowRadius: 6, shadowOpacity: 0.5,
    },
    powerText: { fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    statLabel: { fontSize: 9, letterSpacing: 1, opacity: 0.8, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 2 },
    passButton: {
        width: 80, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
        marginTop: 'auto', marginBottom: 20, overflow: 'hidden', borderWidth: 3, borderColor: '#8B4513',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
    },
    passButtonInner: {
        width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 22,
    },
    passButtonHighlight: {
        borderColor: colors.primary[400], shadowColor: colors.primary[500], shadowRadius: 10, shadowOpacity: 0.8,
    },
    passButtonDisabled: { opacity: 0.8, borderColor: '#3E1F0E' },
    boardArea: {
        flex: 1,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    boardHalf: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    boardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '90%',
        alignSelf: 'center',
    },
    boardZoneContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardZoneContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    activeBoardZone: {
        // Optional: Subtle highlight when card is selected and player needs to play
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
    },
    handZone: {
        position: 'absolute', bottom: 0, height: 120, flexDirection: 'row',
        justifyContent: 'center', alignItems: 'flex-end', zIndex: 50,
    },
    handCardContainer: {
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8,
    },
    toastContainer: { position: 'absolute', top: 100, alignSelf: 'center', zIndex: 100 },
    toastContent: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    overlayCard: { padding: 40, backgroundColor: '#111', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    overlayBtn: { backgroundColor: colors.primary[500], paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, minWidth: 150, alignItems: 'center' },

    // Removed old row styles
});
