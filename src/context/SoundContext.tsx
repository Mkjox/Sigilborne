import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';

type SoundType = 'bgm_main' | 'bgm_battle' | 'card_play' | 'card_draw' | 'round_win' | 'round_lose' | 'game_victory' | 'game_defeat' | 'hero_ability' | 'button_click';

interface SoundContextType {
    playSound: (name: SoundType) => Promise<void>;
    playMusic: (name: SoundType) => Promise<void>;
    stopMusic: () => void;
    isMuted: boolean;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Sound asset mapping
// Note: In a real app, you'd import these. Using require with safe checks or predefined map keys.
const SOUND_MAP: Record<SoundType, AudioSource | null> = {
    bgm_main: null, // require('../../assets/sounds/bgm_main.mp3'),
    bgm_battle: null, // require('../../assets/sounds/bgm_battle.mp3'),
    card_play: null, // require('../../assets/sounds/card_play.mp3'),
    card_draw: null, // require('../../assets/sounds/card_draw.mp3'),
    round_win: null, // require('../../assets/sounds/round_win.mp3'),
    round_lose: null, // require('../../assets/sounds/round_lose.mp3'),
    game_victory: null, // require('../../assets/sounds/game_victory.mp3'),
    game_defeat: null, // require('../../assets/sounds/game_defeat.mp3'),
    hero_ability: null, // require('../../assets/sounds/hero_ability.mp3'),
    button_click: null, // require('../../assets/sounds/button_click.mp3'),
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolumeState] = useState(1.0);
    const [currentBGM, setCurrentBGM] = useState<SoundType | null>(null);

    // BGM player - uses the hook. We'll manage playback manually.
    const bgmPlayer = useAudioPlayer(null);

    // For one-shot SFX, we create temporary players
    const sfxPlayerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

    const playSound = useCallback(async (name: SoundType) => {
        if (isMuted) return;
        const source = SOUND_MAP[name];
        if (!source) return;

        try {
            // For one-shot sounds, we'd ideally create a temporary player
            // expo-audio's hook-based API is component-scoped, so for dynamic SFX,
            // we use a simpler approach: replace the source and play.
            // In a production app, consider a pool of players or a different strategy.
            // For now, we'll just log that this would play.
            console.log(`[SoundContext] Would play SFX: ${name}`);
        } catch (error) {
            console.warn(`Failed to play sound ${name}:`, error);
        }
    }, [isMuted]);

    const playMusic = useCallback(async (name: SoundType) => {
        if (currentBGM === name && bgmPlayer.playing) return; // Already playing

        const source = SOUND_MAP[name];
        if (!source) {
            setCurrentBGM(null);
            return;
        }

        try {
            bgmPlayer.replace(source);
            bgmPlayer.loop = true;
            bgmPlayer.volume = isMuted ? 0 : volume * 0.8;
            bgmPlayer.play();
            setCurrentBGM(name);
        } catch (error) {
            console.warn(`Failed to play music ${name}:`, error);
        }
    }, [currentBGM, bgmPlayer, isMuted, volume]);

    const stopMusic = useCallback(() => {
        bgmPlayer.pause();
        bgmPlayer.seekTo(0);
        setCurrentBGM(null);
    }, [bgmPlayer]);

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        bgmPlayer.volume = newMuted ? 0 : volume * 0.8;
    }, [isMuted, bgmPlayer, volume]);

    const handleSetVolume = useCallback((vol: number) => {
        setVolumeState(vol);
        if (!isMuted) {
            bgmPlayer.volume = vol * 0.8;
        }
    }, [isMuted, bgmPlayer]);

    return (
        <SoundContext.Provider value={{
            playSound,
            playMusic,
            stopMusic,
            isMuted,
            toggleMute,
            setVolume: handleSetVolume
        }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
