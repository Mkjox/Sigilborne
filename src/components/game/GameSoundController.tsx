import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { useSound } from '../../context/SoundContext';

export const GameSoundController: React.FC = () => {
    const { playSound, playMusic, stopMusic } = useSound();

    // Select relevant state parts
    const roundsWon = useGameStore(state => state.roundsWon);
    const gameOver = useGameStore(state => state.gameOver);
    const winner = useGameStore(state => state.winner);
    const playerHand = useGameStore(state => state.player.hand.length);
    const aiHand = useGameStore(state => state.ai.hand.length);
    const currentTurn = useGameStore(state => state.currentTurn);

    // Refs to track previous values
    const prevRoundsWon = useRef(roundsWon);
    const prevPlayerHand = useRef(playerHand);
    const prevAiHand = useRef(aiHand);
    const prevGameOver = useRef(gameOver);

    // Start BGM
    useEffect(() => {
        playMusic('bgm_battle');
        return () => {
            stopMusic();
        };
    }, []);

    // Round Win/Loss
    useEffect(() => {
        const prev = prevRoundsWon.current;
        if (roundsWon.player > prev.player) {
            playSound('round_win');
        } else if (roundsWon.ai > prev.ai) {
            playSound('round_lose');
        }
        prevRoundsWon.current = roundsWon;
    }, [roundsWon]);

    // Card Play (Hand size decrease)
    useEffect(() => {
        if (playerHand < prevPlayerHand.current) {
            playSound('card_play');
        }
        prevPlayerHand.current = playerHand;
    }, [playerHand]);

    useEffect(() => {
        if (aiHand < prevAiHand.current) {
            playSound('card_play');
        }
        prevAiHand.current = aiHand;
    }, [aiHand]);

    // Game Over
    useEffect(() => {
        if (gameOver && !prevGameOver.current) {
            stopMusic();
            if (winner === 'player') {
                playSound('game_victory');
            } else {
                playSound('game_defeat');
            }
        }
        prevGameOver.current = gameOver;
    }, [gameOver, winner]);

    return null; // Logic only component
};
