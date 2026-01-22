import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

type SoundType = 'bgm_main' | 'bgm_battle' | 'card_play' | 'card_draw' | 'round_win' | 'round_lose' | 'game_victory' | 'game_defeat' | 'hero_ability' | 'button_click';

interface SoundContextType {
    playSound: (name: SoundType) => Promise<void>;
    playMusic: (name: SoundType) => Promise<void>;
    stopMusic: () => Promise<void>;
    isMuted: boolean;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Sound asset mapping
// Note: In a real app, you'd import these. Using require with safe checks or predefined map keys.
const SOUND_MAP: Record<SoundType, any> = {
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
    const [volume, setVolume] = useState(1.0);
    const bgmSound = useRef<Audio.Sound | null>(null);
    const [currentBGM, setCurrentBGM] = useState<SoundType | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (bgmSound.current) {
                bgmSound.current.unloadAsync();
            }
        };
    }, []);

    const playSound = async (name: SoundType) => {
        if (isMuted) return;
        const source = SOUND_MAP[name];
        if (!source) return;

        try {
            const { sound } = await Audio.Sound.createAsync(source);
            await sound.setVolumeAsync(volume);
            await sound.playAsync();
            // Unload after playback (simple one-shot)
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (error) {
            console.warn(`Failed to play sound ${name}:`, error);
        }
    };

    const playMusic = async (name: SoundType) => {
        if (currentBGM === name && bgmSound.current) return; // Already playing

        try {
            if (bgmSound.current) {
                await bgmSound.current.stopAsync();
                await bgmSound.current.unloadAsync();
                bgmSound.current = null;
            }

            const source = SOUND_MAP[name];
            if (!source) {
                setCurrentBGM(null);
                return;
            }

            const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, isLooping: true });
            bgmSound.current = sound;
            await sound.setVolumeAsync(isMuted ? 0 : volume * 0.8); // BGM slightly quieter
            setCurrentBGM(name);
        } catch (error) {
            console.warn(`Failed to play music ${name}:`, error);
        }
    };

    const stopMusic = async () => {
        if (bgmSound.current) {
            await bgmSound.current.stopAsync();
        }
        setCurrentBGM(null);
    };

    const toggleMute = async () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (bgmSound.current) {
            await bgmSound.current.setVolumeAsync(newMuted ? 0 : volume * 0.8);
        }
    };

    const handleSetVolume = (vol: number) => {
        setVolume(vol);
        if (bgmSound.current && !isMuted) {
            bgmSound.current.setVolumeAsync(vol * 0.8);
        }
    };

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
