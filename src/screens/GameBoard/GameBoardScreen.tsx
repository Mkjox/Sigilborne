import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { RootStackParamList, RowType, Card } from '../../types';
import { Text } from '../../components/ui';
import { CardComponent } from '../../components/game';
import { colors, spacing, borderRadius, getCardDimensions } from '../../theme';
import { useGameStore } from '../../store';

type GameBoardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameBoard'>;
type GameBoardScreenRouteProp = RouteProp<RootStackParamList, 'GameBoard'>;

interface Props {
    navigation: GameBoardScreenNavigationProp;
    route: GameBoardScreenRouteProp;
}

// Compact row component for landscape
const CompactRow: React.FC<{
    row: RowType;
    cards: Card[];
    power: number;
    isPlayer: boolean;
    cardWidth: number;
    cardHeight: number;
    onPress?: (row: RowType) => void;
}> = ({ row, cards, power, isPlayer, cardWidth, cardHeight, onPress }) => {
    const icons = { melee: '⚔️', ranged: '🏹', siege: '💥' };
    return (
        <Pressable
            style={[styles.compactRow, !isPlayer && styles.enemyRow]}
            onPress={() => onPress?.(row)}
        >
            <View style={styles.rowLabel}>
                <Text variant="caption" style={{ fontSize: 10 }}>{icons[row]}</Text>
                <Text variant="caption" color={colors.secondary[400]} style={{ fontSize: 10, fontWeight: 'bold' }}>{power}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowCards}>
                {cards.map(card => (
                    <CardComponent key={card.id} card={card} width={cardWidth} height={cardHeight} isPlayable={false} />
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
        selectedCardId, roundsWon, currentRound, weather,
        getPlayerPower, getAIPower, useHeroAbility, message,
    } = useGameStore();

    useEffect(() => { startGame(difficulty); }, [difficulty]);

    const cardDims = getCardDimensions(screenWidth, screenHeight);
    const handCardW = cardDims.width * 2;
    const handCardH = cardDims.height * 1;
    const boardCardW = cardDims.width * 0.45;
    const boardCardH = cardDims.height * 0.45;

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

    // Toast Component
    const Toast = () => {
        if (!message) return null;
        // Only show for round results or specific events if needed
        const isRoundResult = message.includes('Won Round') || message.includes('Draw');

        // Simple auto-hide effect managed by key-change or existing store timing?
        // GameStore message stays until changed. We might want to clear it? 
        // For now, just render it. The user sees it change.

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
                    <Text variant="h4" color={message.includes('You') ? colors.success : (message.includes('AI') ? colors.error : colors.text.primary)}>
                        {message}
                    </Text>
                </LinearGradient>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <LinearGradient colors={[colors.background.primary, '#0a0015', '#050008']} style={StyleSheet.absoluteFill} />

            <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left + 8, paddingRight: insets.right + 8 }]}>
                {/* LEFT: Player Hand */}
                <View style={styles.leftPanel}>
                    <View style={styles.handHeader}>
                        <Pressable onPress={() => { resetGame(); navigation.navigate('MainMenu'); }}>
                            <Text variant="caption" color={colors.primary[400]}>☰</Text>
                        </Pressable>
                        <Text variant="caption" color={colors.text.secondary}>Hand ({player.hand.length})</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
                        {player.hand.map(card => (
                            <CardComponent
                                key={card.id}
                                card={card}
                                width={handCardW}
                                height={handCardH}
                                isSelected={selectedCardId === card.id}
                                isPlayable={isPlayerTurn && !player.hasPassed && (card.manaCost ?? 0) <= player.mana}
                                onPress={() => handleCardPress(card)}
                            />
                        ))}
                    </ScrollView>
                    <View style={styles.handFooter}>
                        <Text variant="caption" color={colors.accent[400]}>⚡{player.mana}</Text>
                        <Pressable
                            onPress={passTurn}
                            disabled={!isPlayerTurn || player.hasPassed}
                            style={[
                                styles.passBtn,
                                isPlayerTurn && !player.hand.some(c => (c.manaCost ?? 0) <= player.mana) && !player.hasPassed
                                    ? { backgroundColor: colors.warning, transform: [{ scale: 1.1 }], borderWidth: 1, borderColor: '#fff' }
                                    : {}
                            ]}
                        >
                            <Text
                                variant="caption"
                                color={isPlayerTurn && !player.hand.some(c => (c.manaCost ?? 0) <= player.mana) && !player.hasPassed
                                    ? colors.text.primary
                                    : (isPlayerTurn ? colors.warning : colors.text.disabled)}
                                style={{ fontWeight: 'bold' }}
                            >
                                {isPlayerTurn && !player.hand.some(c => (c.manaCost ?? 0) <= player.mana) && !player.hasPassed ? "END ROUND" : "PASS"}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* CENTER: Board */}
                <View style={styles.centerPanel}>
                    {/* Round/Score */}
                    <View style={styles.scoreBar}>
                        <Text variant="caption" color={colors.text.tertiary}>R{currentRound}</Text>
                        <Text variant="caption" color={colors.error}>{aiPower}</Text>
                        <Text variant="caption" color={colors.text.tertiary}>vs</Text>
                        <Text variant="caption" color={colors.primary[400]}>{playerPower}</Text>
                        <Text variant="caption" color={colors.text.tertiary}>{roundsWon.player}-{roundsWon.ai}</Text>
                    </View>

                    {/* AI Rows */}
                    <CompactRow row="siege" cards={ai.board.siege} power={ai.board.siege.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={false} cardWidth={boardCardW} cardHeight={boardCardH} />
                    <CompactRow row="ranged" cards={ai.board.ranged} power={ai.board.ranged.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={false} cardWidth={boardCardW} cardHeight={boardCardH} />
                    <CompactRow row="melee" cards={ai.board.melee} power={ai.board.melee.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={false} cardWidth={boardCardW} cardHeight={boardCardH} />

                    {/* Divider */}
                    <LinearGradient colors={[colors.primary[700], colors.primary[500], colors.primary[700]]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.divider} />

                    {/* Player Rows */}
                    <CompactRow row="melee" cards={player.board.melee} power={player.board.melee.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={true} cardWidth={boardCardW} cardHeight={boardCardH} onPress={handleRowPress} />
                    <CompactRow row="ranged" cards={player.board.ranged} power={player.board.ranged.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={true} cardWidth={boardCardW} cardHeight={boardCardH} onPress={handleRowPress} />
                    <CompactRow row="siege" cards={player.board.siege} power={player.board.siege.reduce((s, c) => s + (c.power || 0), 0)} isPlayer={true} cardWidth={boardCardW} cardHeight={boardCardH} onPress={handleRowPress} />

                    {/* Turn indicator */}
                    <View style={styles.turnBar}>
                        <View style={[styles.turnDot, { backgroundColor: isPlayerTurn ? colors.success : colors.error }]} />
                        <Text variant="caption" color={colors.text.secondary}>
                            {isAIThinking ? 'AI...' : isPlayerTurn ? 'Your Turn' : 'Enemy'}
                        </Text>
                    </View>
                </View>

                {/* RIGHT: Info */}
                <View style={styles.rightPanel}>
                    <View style={styles.infoBox}>
                        <Text variant="caption" color={colors.error}>AI</Text>
                        <Text variant="caption" color={colors.text.tertiary}>🃏{ai.hand.length}</Text>
                        <Text variant="caption" color={colors.text.tertiary}>📚{ai.deck.length}</Text>
                        {ai.hasPassed && <Text variant="caption" color={colors.warning}>PASS</Text>}
                    </View>
                    <View style={styles.infoBox}>
                        <Text variant="caption" color={colors.primary[400]}>YOU</Text>
                        <Text variant="caption" color={colors.text.tertiary}>📚{player.deck.length}</Text>
                        {player.hasPassed && <Text variant="caption" color={colors.warning}>PASS</Text>}
                    </View>
                    <Pressable style={styles.abilityBtn} onPress={useHeroAbility} disabled={!isPlayerTurn || player.hero.ability.currentCooldown > 0}>
                        <Text variant="caption" color={player.hero.ability.currentCooldown > 0 ? colors.text.disabled : colors.secondary[400]}>
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
                    <Animated.View style={styles.overlayCar} entering={SlideInDown.delay(200).springify()}>
                        <Text variant="h2" style={{
                            color: winner === 'player' ? colors.secondary[300] : (winner === 'draw' ? colors.text.disabled : colors.error),
                            marginBottom: 16
                        }}>
                            {winner === 'player' ? '🏆 VICTORY!' : (winner === 'draw' ? '🤝 DRAW' : '💀 DEFEAT')}
                        </Text>
                        <Pressable onPress={() => startGame(difficulty)} style={styles.overlayBtn}>
                            <Text variant="button" color={colors.text.primary}>PLAY AGAIN</Text>
                        </Pressable>
                        <Pressable onPress={() => { resetGame(); navigation.navigate('MainMenu'); }} style={[styles.overlayBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
                            <Text variant="button" color={colors.text.secondary}>MENU</Text>
                        </Pressable>
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.primary },
    content: { flex: 1, flexDirection: 'row' },
    leftPanel: { width: '18%', borderRightWidth: 1, borderRightColor: colors.border.secondary, paddingRight: 4 },
    centerPanel: { flex: 1, paddingHorizontal: 4 },
    rightPanel: { width: '10%', borderLeftWidth: 1, borderLeftColor: colors.border.secondary, paddingLeft: 4, justifyContent: 'space-between' },
    handHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    handScroll: { alignItems: 'center', gap: 4, paddingBottom: 8 },
    handCard: { marginVertical: 2 },
    handFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    passBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
    scoreBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, marginBottom: 2 },
    compactRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,30,46,0.6)', borderRadius: 4, marginVertical: 1, paddingHorizontal: 4, borderWidth: 1, borderColor: colors.border.secondary },
    enemyRow: { backgroundColor: 'rgba(46,30,30,0.6)' },
    rowLabel: { width: 28, alignItems: 'center' },
    rowCards: { paddingVertical: 2, gap: 2 },
    divider: { height: 8, marginVertical: 2, borderRadius: 4 },
    turnBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 2 },
    turnDot: { width: 6, height: 6, borderRadius: 3 },
    infoBox: { alignItems: 'center', padding: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, gap: 2 },
    abilityBtn: { alignItems: 'center', padding: 8, backgroundColor: colors.primary[700], borderRadius: 8 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    overlayCard: { padding: 24, borderRadius: 16, backgroundColor: 'rgba(20,20,32,0.95)', alignItems: 'center', gap: 12 },
    overlayCar: { padding: 24, borderRadius: 16, backgroundColor: 'rgba(20,20,32,0.95)', alignItems: 'center', gap: 12 },
    overlayBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: colors.primary[600], minWidth: 150, alignItems: 'center' },
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
