import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Pressable, ScrollView, useWindowDimensions, ImageBackground } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence
} from 'react-native-reanimated';
import { RootStackParamList, Card } from '../../types';
import { Text, BoardSurface } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing } from '../../theme';
import { useGameStore } from '../../store';
import { VFXProvider, useVFX } from '../../context/VFXContext';
import { WeatherProvider, useWeather } from '../../context/WeatherContext';
import { SpectralEffectType } from '../../components/game/vfx/SpectralEffect';
import { UnifiedVFXManager } from '../../components/game';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

// Simple Background - Dark Arcane Void
const SimpleBackground: React.FC = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <ImageBackground
                source={require('../../../assets/board_bg.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            >
                {/* Subtle dark tint to ensure text/card readability over the texture */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            </ImageBackground>
            {/* Subtle Void Texture Overlay */}
            <View style={[styles.voidOverlay, { opacity: 0.05 }]} />
        </View>
    );
};

// Single Board Zone Component
const BoardZone: React.FC<{
    cards: Card[];
    isPlayer: boolean;
    cardWidth: number;
    cardHeight: number;
    onPress?: () => void;
    onCardPress?: (card: Card) => void;
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
            disabled={!onPress}
            pointerEvents={onPress ? "auto" : "box-none"}
        >
            {/* Zone Highlight Seams */}
            {isActive && (
                <View style={styles.zoneSeam} />
            )}

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
                        >
                            <Animated.View
                                style={{
                                    marginHorizontal: spacing.sm,
                                    transform: [{ scale: isHighlighted ? 1.08 : (isSelected ? 1.04 : 1) }],
                                    opacity: (highlightedCardIds.length > 0 && !isHighlighted && !isSelected) ? 0.4 : 1,
                                    zIndex: isSelected || isHighlighted ? 20 : 1,
                                }}
                            >
                                {/* Target indicator - Arcane Sigil */}
                                {isHighlighted && !isPlayer && (
                                    <View style={styles.targetIndicator}>
                                        <Text style={{ fontSize: 18, color: colors.arcane.emerald }}>✧</Text>
                                    </View>
                                )}

                                <CardComponent
                                    card={card}
                                    width={cardWidth}
                                    height={cardHeight}
                                    isPlayable={true}
                                    hideStats={false}
                                    isSelected={isSelected}
                                    isTargeted={isHighlighted && !isPlayer}
                                    onPress={() => onCardPress?.(card)}
                                />
                            </Animated.View>
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </Pressable>
    );
};


export const GameBoardScreen: React.FC<Props> = (props) => {
    return (
        <VFXProvider>
            <WeatherProvider>
                <GameBoardContent {...props} />
            </WeatherProvider>
        </VFXProvider>
    );
};

const GameBoardContent: React.FC<Props> = ({ navigation, route }) => {
    const difficulty = route.params?.difficulty || 'medium';
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const {
        startGame, playCard, passTurn, resetGame, selectCard,
        player, ai, currentTurn, gameOver, winner, isAIThinking,
        selectedCardId, roundsWon, currentRound,
        getPlayerPower, getAIPower, useHeroAbility, message,
        attackingCardId, setAttackingCard, attackCard,
        currentVFX, setVFX, weather
    } = useGameStore();

    // Advanced VFX & Shake
    const boardShake = useSharedValue(0);
    const { triggerVFX, registerShakeHandler } = useVFX();
    const { setWeather, clearWeather } = useWeather();

    useEffect(() => {
        registerShakeHandler((intensity) => {
            boardShake.value = withSequence(
                withTiming(intensity, { duration: 50 }),
                withTiming(-intensity, { duration: 50 }),
                withTiming(intensity / 2, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        });
    }, []);

    const animatedBoardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: boardShake.value }],
    }));

    // Sync Weather System with Game State
    useEffect(() => {
        if (currentVFX === 'frost') {
            setWeather('frost');
            setVFX('none');
        } else if (currentVFX === 'fog') {
            setWeather('fog');
            setVFX('none');
        } else if (currentVFX !== 'none') {
            triggerVFX(currentVFX as any, screenWidth / 2, screenHeight / 2);
            setVFX('none');
        }
    }, [currentVFX]);

    // Handle clearing weather if game state dictates (e.g., Clear Skies card played)
    // For now, we'll keep it simple: weather persists until cleared explicitly.

    useEffect(() => { startGame(difficulty); }, [difficulty]);

    // Dimensions
    const sideColWidth = 100;
    const TOTAL_PLAY_SPACE = screenHeight - 60 - insets.bottom;

    // Explicit Vertical Zones (35/35/30)
    const BOARD_HALF_HEIGHT = TOTAL_PLAY_SPACE * 0.35;
    const HAND_ZONE_HEIGHT = TOTAL_PLAY_SPACE * 0.30;

    // Board Card Styling - Dominant
    const cardHeight = Math.min(BOARD_HALF_HEIGHT * 0.75, 140);
    const cardWidth = cardHeight * 0.72;

    // Hand Card Styling - Secondary (Reduced by ~25%)
    const handCardH = Math.min(HAND_ZONE_HEIGHT * 0.7, 100);
    const handCardW = handCardH * 0.72;

    const shouldHighlightPass = currentTurn === 'player' && !isAIThinking && !player.hasPassed;
    const isPlayerTurn = currentTurn === 'player' && !isAIThinking;
    const playerPower = getPlayerPower();
    const aiPower = getAIPower();

    const handleCardPress = (card: Card) => {
        if (!isPlayerTurn || player.hasPassed) return;

        if (attackingCardId) {
            setAttackingCard(null);
            return;
        }

        if (selectedCardId === card.id) {
            playCard(card.id);
        } else {
            selectCard(card.id);
        }
    };

    const handleBoardPress = () => {
        if (selectedCardId) {
            playCard(selectedCardId);
        } else if (attackingCardId) {
            setAttackingCard(null);
        }
    };

    // Targeted Attack Logic
    const handleBoardCardPress = (card: Card, isPlayerSide: boolean) => {
        if (!isPlayerTurn) return;

        if (isPlayerSide) {
            if (attackingCardId === card.id) {
                setAttackingCard(null);
            } else {
                if (!card.isExhausted) {
                    setAttackingCard(card.id);
                }
            }
        } else {
            if (attackingCardId) {
                attackCard(card.id);
            }
        }
    };

    // Calculate highlights
    const validTargets = attackingCardId ? ai.board.map(c => c.id) : [];

    // Toast Component
    const Toast = () => {
        const { message, setMessage, selectedCardId } = useGameStore();

        useEffect(() => {
            if (!message) return;

            // Persistent messages are those that start with card selection info
            const isPersistent = !!selectedCardId && (
                player.hand.some(c => c.id === selectedCardId) ||
                player.board.some(c => c.id === selectedCardId)
            );

            if (!isPersistent) {
                const timer = setTimeout(() => {
                    setMessage(null);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }, [message, selectedCardId]);

        if (!message) return null;

        return (
            <Animated.View
                entering={SlideInDown.springify()}
                exiting={FadeOut}
                style={styles.toastContainer}
                pointerEvents="none"
            >
                <View style={[styles.toastContent, { backgroundColor: colors.arcane.obsidian }]}>
                    <Text
                        variant="caption"
                        style={{ textAlign: 'center', lineHeight: 16 }}
                        color={message.includes('Victory') || message.includes('You Won') || message.includes('Played') ? colors.arcane.emerald : (message.includes('Defeat') || message.includes('AI Won') ? colors.error : colors.arcane.white)}
                    >
                        {message.toUpperCase()}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <BoardSurface style={styles.container}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedBoardStyle]}>
                <SimpleBackground />
                <UnifiedVFXManager />
                <StatusBar hidden />

                {/* TOP HUD BAR */}
                <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
                    {/* Left: Opponent Name */}
                    <View style={styles.topBarLeft}>
                        <View style={styles.avatarMini}>
                            <Text style={{ fontSize: 18 }}>👁</Text>
                        </View>
                        <View>
                            <Text variant="caption" color={colors.arcane.emerald} style={{ fontWeight: '900', letterSpacing: 1 }}>VOID KEEPER</Text>
                            <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 10 }}>The Innkeeper's Shadow</Text>
                        </View>
                    </View>

                    {/* Center: Score */}
                    <View style={styles.topBarCenter}>
                        <View style={[styles.scoreContainer, { borderColor: colors.error }]}>
                            <Text variant="h4" color={colors.error} style={styles.scoreText}>{roundsWon.ai}</Text>
                        </View>
                        <Text variant="caption" color={colors.arcane.emerald} style={{ marginHorizontal: 16, fontSize: 12, opacity: 0.5 }}>⫘</Text>
                        <View style={[styles.scoreContainer, { borderColor: colors.arcane.emerald }]}>
                            <Text variant="h4" color={colors.arcane.emerald} style={styles.scoreText}>{roundsWon.player}</Text>
                        </View>
                    </View>

                    {/* Right: Menu */}
                    <Pressable
                        onPress={() => { resetGame(); navigation.navigate('MainMenu'); }}
                        style={styles.menuBtn}
                    >
                        <Text variant="caption" color={colors.arcane.emerald} style={{ fontWeight: '600' }}>ESCAPE</Text>
                    </Pressable>
                </View>

                {/* MAIN CONTENT - BATTLEFIELD LAYER */}
                <View style={[styles.mainRow, {
                    marginTop: 60,
                    height: BOARD_HALF_HEIGHT * 2,
                    zIndex: 5
                }]}>

                    {/* LEFT COLUMN: Stats */}
                    <View style={[styles.sideColumnLeft, { width: sideColWidth }]}>
                        <View style={styles.statDisplay}>
                            <Text variant="caption" color={colors.text.disabled} style={styles.statLabel}>HAND</Text>
                            <Text variant="h4" color={colors.arcane.white}>{ai.hand.length}</Text>
                        </View>

                        <View style={[styles.statDisplay, { marginTop: 'auto' }]}>
                            <View style={[styles.powerBadge, { borderColor: colors.error }]}>
                                <Text variant="h3" color={colors.arcane.white} style={styles.powerText}>{aiPower}</Text>
                            </View>
                            <Text variant="caption" color={colors.error} style={styles.statLabel}>CORRUPTION</Text>
                        </View>
                    </View>

                    {/* CENTER BOARD */}
                    <View style={styles.boardArea}>
                        {/* AI ZONE (35%) */}
                        <View style={[styles.boardHalf, { height: BOARD_HALF_HEIGHT }]}>
                            <BoardZone
                                cards={ai.board}
                                isPlayer={false}
                                cardWidth={cardWidth}
                                cardHeight={cardHeight}
                                onCardPress={(card) => handleBoardCardPress(card, false)}
                                highlightedCardIds={validTargets}
                            />
                        </View>

                        {/* DIVIDER - Depth Shift */}
                        <View style={styles.boardDividerContainer}>
                            <View style={styles.boardDivider} />
                            <View style={styles.dividerGlow} />
                        </View>

                        {/* PLAYER ZONE (35%) */}
                        <View style={[styles.boardHalf, { height: BOARD_HALF_HEIGHT }]}>
                            <BoardZone
                                cards={player.board}
                                isPlayer={true}
                                cardWidth={cardWidth}
                                cardHeight={cardHeight}
                                isActive={isPlayerTurn && !!selectedCardId}
                                onPress={handleBoardPress}
                                onCardPress={(card) => handleBoardCardPress(card, true)}
                                selectedCardId={attackingCardId}
                            />
                        </View>
                    </View>

                    {/* RIGHT COLUMN: Player Actions */}
                    <View style={[styles.sideColumnRight, { width: sideColWidth }]}>
                        <View style={[styles.statDisplay, { marginBottom: 'auto' }]}>
                            <View style={[styles.powerBadge, { borderColor: colors.arcane.emerald, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Text variant="h3" color={colors.arcane.emerald} style={styles.powerText}>{playerPower}</Text>
                            </View>
                            <Text variant="caption" color={colors.arcane.emerald} style={styles.statLabel}>ESSENCE</Text>
                        </View>

                        <View style={styles.statDisplay}>
                            <View style={[styles.manaBadge]}>
                                <Text variant="h4" color={colors.arcane.white} style={{ fontWeight: 'bold' }}>{player.mana}</Text>
                            </View>
                            <Text variant="caption" color={colors.arcane.cyan} style={styles.statLabel}>MANA</Text>
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
                                colors={player.hasPassed ? [colors.arcane.obsidian, colors.arcane.graphite] : [colors.arcane.emerald, colors.arcane.emeraldDark]}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.passButtonInner}>
                                <Text variant="button" color={player.hasPassed ? colors.text.disabled : colors.arcane.white} style={{ fontWeight: '900', fontSize: 10, letterSpacing: 2 }}>
                                    {player.hasPassed ? "PASSED" : "END TURN"}
                                </Text>
                            </View>
                        </Pressable>
                    </View>

                </View>

                {/* BOTTOM HAND ZONE - UI LAYER */}
                <View
                    style={[
                        styles.handZone,
                        {
                            left: 0,
                            right: 0,
                            height: HAND_ZONE_HEIGHT,
                            bottom: insets.bottom,
                            paddingTop: 10,
                            zIndex: 20
                        }
                    ]}
                    pointerEvents="box-none"
                >
                    <View style={[styles.handContainer, { left: sideColWidth, right: sideColWidth }]}>
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
                                                { translateY: selectedCardId === card.id ? -12 : translateY }
                                            ],
                                            zIndex: selectedCardId === card.id ? 100 : index,
                                            marginLeft: index === 0 ? 0 : -handCardW * 0.35
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
                </View>

                <Toast />

                {/* Game Over Overlay */}
                {gameOver && (
                    <View style={styles.overlay}>
                        <View style={styles.overlayCard}>
                            <Text variant="h2" style={{ color: colors.arcane.white, marginBottom: 20, letterSpacing: 8, fontFamily: 'serif' }}>
                                {winner === 'player' ? 'VICTORY' : (winner === 'draw' ? 'STALEMATE' : 'OBLIVION')}
                            </Text>
                            <Pressable onPress={() => startGame(difficulty)} style={styles.overlayBtn}>
                                <Text variant="button" color={colors.arcane.white} style={{ letterSpacing: 4 }}>REAWAKEN</Text>
                            </Pressable>
                            <Pressable onPress={() => { resetGame(); navigation.navigate('MainMenu'); }} style={[styles.overlayBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.arcane.emerald, marginTop: 16 }]}>
                                <Text variant="button" color={colors.arcane.emerald} style={{ letterSpacing: 4 }}>ABANDON</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </Animated.View>
        </BoardSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.arcane.obsidian,
    },
    voidOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    topBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topBarCenter: { flexDirection: 'row', alignItems: 'center' },
    menuBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)'
    },
    mainRow: {
        flex: 1,
        flexDirection: 'row',
    },
    sideColumnLeft: {
        borderRightWidth: 1,
        borderRightColor: 'rgba(16, 185, 129, 0.05)',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
    },
    sideColumnRight: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(16, 185, 129, 0.05)',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
        justifyContent: 'flex-end',
    },
    avatarMini: {
        width: 36, height: 36, borderRadius: 2, backgroundColor: colors.arcane.graphite,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.arcane.emeraldDark,
    },
    scoreContainer: {
        width: 32, height: 32, borderRadius: 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1.5,
    },
    scoreText: { fontSize: 16, fontWeight: '900', fontFamily: 'serif' },
    statDisplay: { alignItems: 'center', gap: 4, paddingVertical: 8 },
    powerBadge: {
        width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 2, marginBottom: 4,
        shadowColor: colors.arcane.emerald, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10,
    },
    manaBadge: {
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(6, 182, 212, 0.1)', borderWidth: 2, borderColor: colors.arcane.cyan, marginBottom: 4,
    },
    powerText: { fontWeight: '900', fontFamily: 'serif', fontSize: 20 },
    statLabel: { fontSize: 8, letterSpacing: 1.5, opacity: 0.6, fontWeight: '900', fontFamily: 'serif' },
    passButton: {
        width: 90, height: 44, borderRadius: 2, alignItems: 'center', justifyContent: 'center',
        marginTop: 'auto', marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    passButtonInner: {
        width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
    },
    passButtonHighlight: {
        borderColor: colors.arcane.emerald, shadowColor: colors.arcane.emerald, shadowRadius: 8, shadowOpacity: 0.5,
    },
    passButtonDisabled: { opacity: 0.4 },
    boardArea: {
        flex: 1,
        paddingHorizontal: 16,
    },
    boardHalf: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    boardDividerContainer: {
        height: 2,
        width: '90%',
        alignSelf: 'center',
        marginVertical: 4,
        position: 'relative',
        justifyContent: 'center',
    },
    boardDivider: {
        height: 1,
        backgroundColor: colors.arcane.emeraldDark,
        opacity: 0.3,
        width: '100%',
    },
    dividerGlow: {
        position: 'absolute',
        height: 4,
        width: '100%',
        backgroundColor: colors.arcane.emerald,
        opacity: 0.05,
        filter: 'blur(4px)',
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
        backgroundColor: 'rgba(16, 185, 129, 0.02)',
    },
    zoneSeam: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 4,
    },
    targetIndicator: {
        position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center', zIndex: 10
    },
    handZone: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(16, 185, 129, 0.1)',
        backgroundColor: 'rgba(11, 15, 20, 0.8)',
    },
    handContainer: {
        position: 'absolute',
        bottom: 0,
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: 10,
    },
    handCardContainer: {
        shadowColor: colors.arcane.emerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    toastContainer: {
        position: 'absolute',
        top: '38%',
        alignSelf: 'center',
        zIndex: 500,
        width: '50%',
        maxWidth: 280,
    },
    toastContent: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: colors.arcane.emerald,
        shadowColor: colors.arcane.emerald,
        shadowRadius: 10,
        shadowOpacity: 0.15,
    },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    overlayCard: {
        padding: 48,
        backgroundColor: colors.arcane.obsidian,
        borderRadius: 2,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.arcane.emeraldDark,
        shadowColor: colors.arcane.emerald,
        shadowRadius: 30,
        shadowOpacity: 0.2,
    },
    overlayBtn: {
        backgroundColor: colors.arcane.emeraldDark,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 2,
        minWidth: 200,
        alignItems: 'center'
    },
});
