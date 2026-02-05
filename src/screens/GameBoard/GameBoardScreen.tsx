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
import { colors, spacing, borderRadius } from '../../theme';
import { useGameStore } from '../../store';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

// Animated Background Component
const AnimatedBackground: React.FC = () => {
    const orb1 = useSharedValue(0);
    const orb2 = useSharedValue(0);

    useEffect(() => {
        orb1.value = withRepeat(withTiming(1, { duration: 15000 }), -1, true);
        orb2.value = withRepeat(withTiming(1, { duration: 10000 }), -1, true);
    }, []);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(orb1.value, [0, 1], [-50, 50]) },
            { translateY: interpolate(orb1.value, [0, 1], [20, -20]) },
        ],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(orb2.value, [0, 1], [30, -30]) },
            { translateY: interpolate(orb2.value, [0, 1], [-15, 15]) },
        ],
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={[colors.background.primary, '#0a0015', '#050008']}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.bgOrb, styles.bgOrb1, orb1Style]} />
            <Animated.View style={[styles.bgOrb, styles.bgOrb2, orb2Style]} />
        </View>
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
    const icons = { melee: '⚔️', ranged: '🏹', siege: '💥' };

    return (
        <Pressable
            style={[
                styles.compactRow,
                !isPlayer && styles.enemyRow,
                isActive && styles.activeRow
            ]}
            onPress={() => onPress?.(row)}
        >
            <View style={styles.rowPowerBadge}>
                <Text style={styles.rowIcon}>{icons[row]}</Text>
                <Text variant="caption" color={colors.secondary[300]} style={styles.rowPowerText}>
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
                    />
                ))}
                {cards.length === 0 && (
                    <View style={[styles.emptySlot, { width: cardWidth, height: cardHeight }]}>
                        <Text variant="caption" color={colors.text.disabled} style={{ fontSize: 8 }}>
                            EMPTY
                        </Text>
                    </View>
                )}
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
        selectedCardId, roundsWon, currentRound, weather,
        getPlayerPower, getAIPower, useHeroAbility, message,
    } = useGameStore();

    useEffect(() => { startGame(difficulty); }, [difficulty]);

    // Dynamic scaling based on screen size
    const isSmallScreen = screenWidth < 700;
    const leftPanelWidth = Math.max(isSmallScreen ? 90 : 120, screenWidth * 0.12);
    const rightPanelWidth = Math.max(isSmallScreen ? 55 : 70, screenWidth * 0.08);

    // Card dimensions - smaller hand cards, larger board cards
    const handCardW = Math.min(leftPanelWidth - 12, 80);
    const handCardH = handCardW * 1.3;
    const boardCardW = Math.max(45, Math.min(65, screenHeight * 0.12));
    const boardCardH = boardCardW * 1.3;

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
                <LinearGradient
                    colors={['rgba(20, 20, 30, 0.95)', 'rgba(40, 40, 60, 0.9)']}
                    style={styles.toastContent}
                >
                    <Text
                        variant="h4"
                        color={message.includes('You') ? colors.success : (message.includes('AI') ? colors.error : colors.text.primary)}
                    >
                        {message}
                    </Text>
                </LinearGradient>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <AnimatedBackground />

            <View style={[
                styles.content,
                {
                    paddingTop: insets.top + 4,
                    paddingBottom: insets.bottom + 4,
                    paddingLeft: insets.left + 8,
                    paddingRight: insets.right + 8
                }
            ]}>
                {/* LEFT: Player Hand */}
                <View style={[styles.leftPanel, { width: leftPanelWidth }]}>
                    <LinearGradient
                        colors={['rgba(20, 20, 35, 0.8)', 'rgba(15, 15, 25, 0.9)']}
                        style={styles.handPanelBg}
                    />
                    <View style={styles.handHeader}>
                        <Pressable
                            onPress={() => { resetGame(); navigation.navigate('MainMenu'); }}
                            style={styles.menuBtn}
                        >
                            <Text variant="caption" color={colors.primary[400]}>☰</Text>
                        </Pressable>
                        <View style={styles.handCountBadge}>
                            <Text variant="caption" color={colors.text.secondary} style={{ fontSize: 10 }}>
                                HAND
                            </Text>
                            <Text variant="caption" color={colors.primary[400]} style={{ fontWeight: 'bold' }}>
                                {player.hand.length}
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.handScroll}
                    >
                        {player.hand.map(card => (
                            <Animated.View
                                key={card.id}
                                entering={FadeIn.delay(100)}
                                style={styles.handCardWrapper}
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
                        ))}
                    </ScrollView>

                    <View style={styles.handFooter}>
                        <View style={styles.manaBadge}>
                            <Text variant="caption" color={colors.accent[300]} style={{ fontWeight: 'bold' }}>
                                ⚡ {player.mana}
                            </Text>
                        </View>
                        <Pressable
                            onPress={passTurn}
                            disabled={!isPlayerTurn || player.hasPassed}
                            style={[
                                styles.passBtn,
                                shouldHighlightPass && styles.passBtnHighlight,
                                player.hasPassed && styles.passBtnDisabled
                            ]}
                        >
                            <Text
                                variant="caption"
                                color={shouldHighlightPass ? '#fff' : (isPlayerTurn && !player.hasPassed ? colors.warning : colors.text.disabled)}
                                style={{ fontWeight: 'bold', fontSize: 10 }}
                            >
                                {shouldHighlightPass ? "END ROUND" : (player.hasPassed ? "PASSED" : "PASS")}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* CENTER: Board */}
                <View style={styles.centerPanel}>
                    {/* Score Bar */}
                    <View style={styles.scoreBar}>
                        <View style={styles.scoreSection}>
                            <Text variant="caption" color={colors.text.tertiary} style={styles.roundLabel}>
                                R{currentRound}
                            </Text>
                            <Text variant="caption" color={colors.text.secondary} style={{ fontSize: 9 }}>
                                {roundsWon.player}-{roundsWon.ai}
                            </Text>
                        </View>
                        <View style={styles.powerDisplay}>
                            <View style={[styles.powerBox, styles.aiPowerBox]}>
                                <Text variant="caption" color={colors.error} style={styles.powerValue}>
                                    {aiPower}
                                </Text>
                            </View>
                            <Text variant="caption" color={colors.text.tertiary}>vs</Text>
                            <View style={[styles.powerBox, styles.playerPowerBox]}>
                                <Text variant="caption" color={colors.primary[300]} style={styles.powerValue}>
                                    {playerPower}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.turnIndicator}>
                            <View style={[styles.turnDot, { backgroundColor: isPlayerTurn ? colors.success : colors.error }]} />
                            <Text variant="caption" color={colors.text.secondary} style={{ fontSize: 9 }}>
                                {isAIThinking ? 'AI...' : isPlayerTurn ? 'YOU' : 'AI'}
                            </Text>
                        </View>
                    </View>

                    {/* AI Rows */}
                    <CompactRow
                        row="siege"
                        cards={ai.board.siege}
                        power={ai.board.siege.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                    />
                    <CompactRow
                        row="ranged"
                        cards={ai.board.ranged}
                        power={ai.board.ranged.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                    />
                    <CompactRow
                        row="melee"
                        cards={ai.board.melee}
                        power={ai.board.melee.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={false}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                    />

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <LinearGradient
                            colors={['transparent', colors.primary[500], 'transparent']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.divider}
                        />
                        <View style={styles.dividerGlow} />
                    </View>

                    {/* Player Rows */}
                    <CompactRow
                        row="melee"
                        cards={player.board.melee}
                        power={player.board.melee.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        isActive={isPlayerTurn && !!selectedCardId}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                        onPress={handleRowPress}
                    />
                    <CompactRow
                        row="ranged"
                        cards={player.board.ranged}
                        power={player.board.ranged.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        isActive={isPlayerTurn && !!selectedCardId}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                        onPress={handleRowPress}
                    />
                    <CompactRow
                        row="siege"
                        cards={player.board.siege}
                        power={player.board.siege.reduce((s, c) => s + (c.power || 0), 0)}
                        isPlayer={true}
                        isActive={isPlayerTurn && !!selectedCardId}
                        cardWidth={boardCardW}
                        cardHeight={boardCardH}
                        onPress={handleRowPress}
                    />
                </View>

                {/* RIGHT: Info Panel */}
                <View style={[styles.rightPanel, { width: rightPanelWidth }]}>
                    <View style={styles.infoCard}>
                        <Text variant="caption" color={colors.error} style={{ fontWeight: 'bold', fontSize: 10 }}>AI</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>🃏</Text>
                            <Text variant="caption" color={colors.text.tertiary}>{ai.hand.length}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📚</Text>
                            <Text variant="caption" color={colors.text.tertiary}>{ai.deck.length}</Text>
                        </View>
                        {ai.hasPassed && (
                            <Text variant="caption" color={colors.warning} style={{ fontSize: 8, fontWeight: 'bold' }}>
                                PASSED
                            </Text>
                        )}
                    </View>

                    <View style={styles.infoCard}>
                        <Text variant="caption" color={colors.primary[400]} style={{ fontWeight: 'bold', fontSize: 10 }}>YOU</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📚</Text>
                            <Text variant="caption" color={colors.text.tertiary}>{player.deck.length}</Text>
                        </View>
                        {player.hasPassed && (
                            <Text variant="caption" color={colors.warning} style={{ fontSize: 8, fontWeight: 'bold' }}>
                                PASSED
                            </Text>
                        )}
                    </View>

                    <Pressable
                        style={[
                            styles.abilityBtn,
                            player.hero.ability.currentCooldown === 0 && isPlayerTurn && styles.abilityBtnReady
                        ]}
                        onPress={useHeroAbility}
                        disabled={!isPlayerTurn || player.hero.ability.currentCooldown > 0}
                    >
                        <Text
                            variant="caption"
                            color={player.hero.ability.currentCooldown > 0 ? colors.text.disabled : colors.secondary[300]}
                            style={{ fontSize: 16 }}
                        >
                            {player.hero.ability.currentCooldown > 0 ? '✓' : '★'}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Toast Overlay */}
            <Toast />

            {/* Game Over Overlay */}
            {gameOver && (
                <Animated.View style={styles.overlay} entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)}>
                    <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(10,0,21,0.95)']} style={StyleSheet.absoluteFill} />
                    <Animated.View style={styles.overlayCard} entering={SlideInDown.delay(200).springify()}>
                        <Text variant="h2" style={{
                            color: winner === 'player' ? colors.secondary[300] : (winner === 'draw' ? colors.text.disabled : colors.error),
                            marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            {winner === 'player' ? '🏆 VICTORY!' : (winner === 'draw' ? '🤝 DRAW' : '💀 DEFEAT')}
                        </Text>
                        <Pressable onPress={() => startGame(difficulty)} style={styles.overlayBtn}>
                            <Text variant="button" color={colors.text.primary}>PLAY AGAIN</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => { resetGame(); navigation.navigate('MainMenu'); }}
                            style={[styles.overlayBtn, styles.overlayBtnSecondary]}
                        >
                            <Text variant="button" color={colors.text.secondary}>MENU</Text>
                        </Pressable>
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary
    },
    bgOrb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.08,
    },
    bgOrb1: {
        backgroundColor: colors.primary[500],
        top: -100,
        right: -50,
    },
    bgOrb2: {
        backgroundColor: colors.secondary[500],
        bottom: -100,
        left: -50,
    },
    content: {
        flex: 1,
        flexDirection: 'row'
    },

    // Left Panel (Hand)
    leftPanel: {
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    handPanelBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.md,
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    menuBtn: {
        padding: 4,
    },
    handCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    handScroll: {
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
        paddingBottom: 8
    },
    handCardWrapper: {
        marginVertical: 2,
    },
    handFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    manaBadge: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    passBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    passBtnHighlight: {
        backgroundColor: colors.warning,
        borderWidth: 1,
        borderColor: '#fff',
    },
    passBtnDisabled: {
        opacity: 0.5,
    },

    // Center Panel (Board)
    centerPanel: {
        flex: 1,
        paddingHorizontal: 6,
    },
    scoreBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        marginBottom: 4,
    },
    scoreSection: {
        minWidth: 30,
    },
    roundLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    powerDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    powerBox: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        minWidth: 40,
        alignItems: 'center',
    },
    aiPowerBox: {
        backgroundColor: 'rgba(255, 100, 100, 0.2)',
    },
    playerPowerBox: {
        backgroundColor: 'rgba(100, 150, 255, 0.2)',
    },
    powerValue: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    turnIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    turnDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    compactRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30,30,46,0.6)',
        borderRadius: 6,
        marginVertical: 1,
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    enemyRow: {
        backgroundColor: 'rgba(46,30,30,0.6)',
    },
    activeRow: {
        borderColor: colors.primary[400],
        backgroundColor: 'rgba(30,40,60,0.7)',
    },
    rowPowerBadge: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
    },
    rowIcon: {
        fontSize: 12,
    },
    rowPowerText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    rowCards: {
        paddingVertical: 2,
        gap: 3,
        alignItems: 'center',
    },
    emptySlot: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dividerContainer: {
        marginVertical: 4,
        alignItems: 'center',
    },
    divider: {
        height: 2,
        width: '100%',
        borderRadius: 1,
    },
    dividerGlow: {
        position: 'absolute',
        width: '60%',
        height: 8,
        backgroundColor: colors.primary[500],
        opacity: 0.2,
        borderRadius: 4,
    },


    // Right Panel (Info)
    rightPanel: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
        paddingLeft: 6,
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoCard: {
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(20, 20, 35, 0.8)',
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoIcon: {
        fontSize: 10,
    },
    abilityBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'rgba(20, 20, 35, 0.8)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    abilityBtnReady: {
        borderColor: colors.secondary[400],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },

    // Overlays
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    overlayCard: {
        padding: 32,
        borderRadius: 20,
        backgroundColor: 'rgba(20,20,32,0.95)',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 250,
    },
    overlayBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        backgroundColor: colors.primary[600],
        minWidth: 180,
        alignItems: 'center',
    },
    overlayBtnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    toastContainer: {
        position: 'absolute',
        top: '20%',
        alignSelf: 'center',
        zIndex: 100,
        width: '50%',
        maxWidth: 400,
    },
    toastContent: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    }
});

