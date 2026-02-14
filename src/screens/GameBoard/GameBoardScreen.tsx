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
import { RootStackParamList, RowType, Card } from '../../types';
import { Text } from '../../components/ui';
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

// Compact row component for landscape
const CompactRow: React.FC<{
    row: RowType;
    cards: Card[];
    power: number;
    isPlayer: boolean;
    cardWidth: number;
    cardHeight: number;
    isActive?: boolean;
    onPress?: (row: RowType) => void;
}> = ({ row, cards, power, isPlayer, cardWidth, cardHeight, isActive, onPress }) => {
    return (
        <Pressable
            style={[
                styles.rowContainer,
                isActive && styles.activeRow,
                !isPlayer && styles.enemyRow
            ]}
            onPress={() => onPress?.(row)}
            disabled={!isPlayer}
        >
            <View style={styles.rowPowerBadge}>
                {/* Simplified power indicator in the row itself or let the side column handle it? 
                    Request said "mostly empty, reserved for played cards". 
                    But we usually need to know row strength. 
                    I'll keep a minimal semi-transparent number. 
                */}
                <Text variant="caption" color={isPlayer ? colors.primary[300] : colors.error} style={styles.rowPowerText}>
                    {power}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowCards}
            >
                {cards.map(card => (
                    <CardComponent
                        key={card.id}
                        card={card}
                        width={cardWidth}
                        height={cardHeight}
                        isPlayable={false}
                        hideStats={true}
                    />
                ))}
            </ScrollView>
        </Pressable>
    );
};

export const GameBoardScreen: React.FC<Props> = ({ navigation, route }) => {
    const { difficulty } = route.params;
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const {
        startGame, playCard, passTurn, resetGame, selectCard,
        player, ai, currentTurn, gameOver, winner, isAIThinking,
        selectedCardId, roundsWon, currentRound,
        getPlayerPower, getAIPower, useHeroAbility, message,
    } = useGameStore();

    useEffect(() => { startGame(difficulty); }, [difficulty]);

    // Dimensions
    // Side columns: 80px fixed
    const sideColWidth = 90;

    // Board calculations
    // We have 6 rows roughly. 
    // Available height: ScreenHeight - TopBar (50) - BottomInset
    const availableHeight = screenHeight - 60;
    const rowHeight = availableHeight / 6.5; // slight overlap? or just fit them
    const cardHeight = Math.min(rowHeight * 0.9, 90);
    const cardWidth = cardHeight * 0.72;

    // Hand Card Height: Max 25% of screen, or 160
    const handCardH = Math.min(screenHeight * 0.25, 160);
    const handCardW = handCardH * 0.72;

    // Board Card Height: Strictly 70% of hand card height
    const boardCardH = handCardH * 0.70;
    const boardCardW = boardCardH * 0.72;

    // Pass Button Size: Matches Hand Card Height for visual weight
    const passBtnSize = handCardH;

    // HUD Text Size
    const hudFontSize = screenHeight * 0.035;

    const isPlayerTurn = currentTurn === 'player' && !isAIThinking;
    const playerPower = getPlayerPower();
    const aiPower = getAIPower();

    const handleCardPress = (card: Card) => {
        if (!isPlayerTurn || player.hasPassed) return;
        if (selectedCardId === card.id) playCard(card.id);
        else selectCard(card.id);
    };

    const handleRowPress = (row: RowType) => {
        if (selectedCardId) playCard(selectedCardId, row);
    };

    const canPlayAnyCard = player.hand.some(c => (c.manaCost ?? 0) <= player.mana);
    const shouldHighlightPass = isPlayerTurn && !canPlayAnyCard && !player.hasPassed;

    // Toast Component
    const Toast = () => {
        if (!message) return null;
        const isRoundResult = message.includes('Won Round') || message.includes('Draw');
        if (!isRoundResult) return null;

        return (
            <Animated.View
                entering={SlideInDown.springify()}
                exiting={FadeOut}
                style={styles.toastContainer}
            >
                <View style={styles.toastContent}>
                    <Text variant="h4" color={message.includes('You') ? colors.success : (message.includes('AI') ? colors.error : colors.text.primary)}>
                        {message}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <SimpleBackground />

            {/* TOP HUD BAR */}
            <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
                {/* Left: Opponent Name/Avatar */}
                <View style={styles.topBarLeft}>
                    <View style={styles.avatarMini}>
                        {/* Placeholder for AI avatar or class icon */}
                        <Text style={{ fontSize: 18 }}>🤖</Text>
                    </View>
                    <View>
                        <Text variant="caption" color={colors.text.secondary} style={{ fontWeight: 'bold' }}>OPPONENT</Text>
                        <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 10 }}>The Innkeeper</Text>
                    </View>
                </View>

                {/* Center: Score with ornate styling */}
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

            {/* MAIN CONTENT ROW */}
            <View style={[styles.mainRow, { marginTop: 60, marginBottom: insets.bottom }]}>

                {/* CARD DETAILS PANEL */}
                {selectedCardId && (() => {
                    const card = player.hand.find(c => c.id === selectedCardId);
                    if (card) return (
                        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.cardDetailsPanel}>
                            <View style={styles.cardDetailHeader}>
                                <Text variant="h4" color={colors.text.primary}>{card.name}</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={[styles.miniBadge, { backgroundColor: colors.accent[500] }]}>
                                        <Text variant="caption">{card.manaCost}</Text>
                                    </View>
                                    {card.power !== undefined && (
                                        <View style={[styles.miniBadge, { backgroundColor: colors.secondary[500] }]}>
                                            <Text variant="caption">{card.power}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Text variant="caption" color={colors.text.secondary} style={{ fontStyle: 'italic', marginBottom: 4 }}>
                                {card.flavorText || "A mysterious card."}
                            </Text>
                            <Text variant="body" color={colors.text.primary} style={{ fontSize: 12 }}>
                                {card.description}
                            </Text>
                            <Text variant="caption" color={colors.text.disabled} style={{ marginTop: 4, alignSelf: 'flex-end' }}>
                                Tap again to play
                            </Text>
                        </Animated.View>
                    );
                    return null;
                })()}

                {/* LEFT COLUMN: Opponent Stats */}
                <View style={[styles.sideColumnLeft, { width: sideColWidth }]}>
                    <View style={styles.statDisplay}>
                        <Text variant="caption" color={colors.text.disabled} style={styles.statLabel}>HAND</Text>
                        <Text variant="h4" color={colors.text.primary}>{ai.hand.length}</Text>
                    </View>

                    <View style={styles.statDisplay}>
                        <Text variant="caption" color={colors.text.disabled} style={styles.statLabel}>DECK</Text>
                        <Text variant="h4" color={colors.text.primary}>{ai.deck.length}</Text>
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
                    {isPlayerTurn && (
                        <View style={styles.floatingTurnLabel}>
                            <Text variant="h2" color="rgba(255,255,255,0.1)">YOUR TURN</Text>
                        </View>
                    )}

                    {/* AI SIDE */}
                    <View style={styles.boardHalf}>
                        <CompactRow row="siege" cards={ai.board.siege} power={0} isPlayer={false} cardWidth={cardWidth} cardHeight={cardHeight} />
                        <CompactRow row="ranged" cards={ai.board.ranged} power={0} isPlayer={false} cardWidth={cardWidth} cardHeight={cardHeight} />
                        <CompactRow row="melee" cards={ai.board.melee} power={0} isPlayer={false} cardWidth={cardWidth} cardHeight={cardHeight} />
                    </View>

                    {/* DIVIDER */}
                    <View style={styles.boardDivider} />

                    {/* PLAYER SIDE */}
                    <View style={styles.boardHalf}>
                        <CompactRow row="melee" cards={player.board.melee} power={0} isPlayer={true} isActive={isPlayerTurn && !!selectedCardId} cardWidth={cardWidth} cardHeight={cardHeight} onPress={handleRowPress} />
                        <CompactRow row="ranged" cards={player.board.ranged} power={0} isPlayer={true} isActive={isPlayerTurn && !!selectedCardId} cardWidth={cardWidth} cardHeight={cardHeight} onPress={handleRowPress} />
                        <CompactRow row="siege" cards={player.board.siege} power={0} isPlayer={true} isActive={isPlayerTurn && !!selectedCardId} cardWidth={cardWidth} cardHeight={cardHeight} onPress={handleRowPress} />
                    </View>
                </View>

                {/* RIGHT COLUMN: Player Actions */}
                <View style={[styles.sideColumnRight, { width: sideColWidth }]}>

                    {/* Power Stat */}
                    <View style={[styles.statDisplay, { marginBottom: 'auto' }]}>
                        <View style={[styles.powerBadge, { borderColor: colors.primary[500], backgroundColor: 'rgba(212,175,55,0.2)' }]}>
                            <Text variant="h3" color={colors.primary[200]} style={styles.powerText}>{playerPower}</Text>
                        </View>
                        <Text variant="caption" color={colors.primary[400]} style={styles.statLabel}>POWER</Text>
                    </View>

                    {/* Energy - Text only, no icon */}
                    <View style={styles.statDisplay}>
                        <View style={[styles.manaBadge]}>
                            <Text variant="h4" color="#fff" style={{ fontWeight: 'bold' }}>{player.mana}</Text>
                        </View>
                        <Text variant="caption" color={colors.accent[400]} style={styles.statLabel}>MANA</Text>
                    </View>

                    {/* Pass Button - Ornate Pill shaped */}
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

            {/* BOTTOM HAND ZONE - Floating Over Everything */}
            <View
                style={[styles.handZone, { left: sideColWidth, right: sideColWidth, paddingBottom: insets.bottom + 10 }]}
                pointerEvents="box-none"
            >
                {player.hand.map((card, index) => {
                    // Fan calculation
                    const totalCards = player.hand.length;
                    const centerIndex = (totalCards - 1) / 2;
                    const rotate = (index - centerIndex) * 3; // 3 degrees per card
                    const translateY = Math.abs(index - centerIndex) * 2; // arch effect

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
                                    marginLeft: index === 0 ? 0 : -40 // Overlap
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a', // Fallback
    },


    // Top Bar
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60, // approximate
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // backgroundColor: 'rgba(0,0,0,0.2)', // Very subtle
        zIndex: 20,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topBarCenter: { flexDirection: 'row', alignItems: 'center' },

    menuBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 16 },

    // Main Row
    mainRow: {
        flex: 1,
        flexDirection: 'row',
    },

    // Side Columns
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
        justifyContent: 'flex-end', // Items closer to bottom for player usage?
    },
    avatarMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary[700],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: colors.accent[500], // Bronze border
    },
    scoreContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: colors.error,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    statDisplay: {
        alignItems: 'center',
        gap: 2,
        paddingVertical: 8,
    },
    powerBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 2,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    manaBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent[600], // Bronze/Copper
        borderWidth: 2,
        borderColor: colors.accent[300],
        marginBottom: 4,
        shadowColor: colors.accent[500],
        shadowRadius: 6,
        shadowOpacity: 0.5,
    },
    powerText: {
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    statLabel: {
        fontSize: 9,
        letterSpacing: 1,
        opacity: 0.8,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowRadius: 2,
    },
    passButton: {
        width: 80,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#8B4513', // Brown border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
    },
    passButtonInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)', // Inner highlight
        borderRadius: 22,
    },
    passButtonHighlight: {
        borderColor: colors.primary[400], // Gold border
        shadowColor: colors.primary[500],
        shadowRadius: 10,
        shadowOpacity: 0.8,
    },
    passButtonDisabled: {
        opacity: 0.8,
        borderColor: '#3E1F0E',
    },

    // Center Board
    boardArea: {
        flex: 1,
        paddingHorizontal: 10,
        // Ensure board content is vertically centered or distributed
        justifyContent: 'center',
    },
    boardHalf: {
        flex: 1,
        justifyContent: 'space-evenly',
        paddingVertical: 10,
    },
    boardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '80%',
        alignSelf: 'center',
    },
    floatingTurnLabel: {
        position: 'absolute',
        top: '40%',
        alignSelf: 'center',
        zIndex: 0,
        transform: [{ translateY: -50 }], // Adjust based on font size
    },

    // Rows - Organic, rounded style
    rowContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
        borderRadius: 20, // More rounded for organic feel
        paddingVertical: 6,
        backgroundColor: 'rgba(74,63,53,0.15)', // Warm brown tint
    },
    enemyRow: {
        // backgroundColor: 'rgba(255,0,0,0.02)',
    },
    activeRow: {
        backgroundColor: 'rgba(212,175,55,0.12)', // Gold tint
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    rowPowerBadge: {
        position: 'absolute',
        left: 10,
        zIndex: 10,
        backgroundColor: 'rgba(26,20,16,0.7)', // Warm dark background
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
    },
    rowPowerText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    rowCards: {
        paddingLeft: 30, // Make spaced for power badge
        alignItems: 'center',
        paddingRight: 10,
        gap: 4,
    },

    // Hand Zone
    handZone: {
        position: 'absolute',
        bottom: 0,
        height: 120, // Hitbox height
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        zIndex: 50,
        // Pointer events auto so we can click through empty space? 
        // View doesn't support pointer-events CSS prop directly in standard RN style object without specific props, 
        // but default is fine here, careful about blocking board interactions behind it. 
        // We might want to remove 'height' restriction or make it pickable.
        // Actually, let's keep it restricted height so it doesn't block the WHOLE board.
    },
    handCardContainer: {
        // Shadow/Elevation
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },

    // Overlays
    toastContainer: {
        position: 'absolute', top: 100, alignSelf: 'center',
        zIndex: 100,
    },
    toastContent: {
        backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8,
    },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    overlayCard: { padding: 40, backgroundColor: '#111', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    overlayBtn: { backgroundColor: colors.primary[500], paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, minWidth: 150, alignItems: 'center' },

    cardDetailsPanel: {
        position: 'absolute',
        bottom: 180, // Just above hand
        left: '20%',
        right: '20%',
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        borderWidth: 1,
        borderColor: colors.primary[500],
        borderRadius: borderRadius.md,
        padding: spacing.md,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    cardDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    miniBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
