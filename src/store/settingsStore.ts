import { create } from 'zustand';

// Settings state
interface SettingsState {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    language: string;
    // Actions
    toggleSound: () => void;
    toggleMusic: () => void;
    toggleHaptics: () => void;
    setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
    setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    animationSpeed: 'normal',
    language: 'en',

    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
    toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
    setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
    setLanguage: (lang) => {
        set({ language: lang });
    },
}));
