import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Settings state
interface SettingsState {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    language: string;
    hasSeenTutorial: boolean;
    // Actions
    toggleSound: () => void;
    toggleMusic: () => void;
    toggleHaptics: () => void;
    setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
    setLanguage: (lang: string) => void;
    completeTutorial: () => void;
    resetTutorial: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            soundEnabled: true,
            musicEnabled: true,
            hapticsEnabled: true,
            animationSpeed: 'normal',
            language: 'en',
            hasSeenTutorial: false,

            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
            toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
            toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
            setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
            setLanguage: (lang) => {
                set({ language: lang });
            },
            completeTutorial: () => set({ hasSeenTutorial: true }),
            resetTutorial: () => set({ hasSeenTutorial: false }),
        }),
        {
            name: 'sigilborne-settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state && state.language) {
                    import('../i18n').then(({ default: i18n }) => {
                        if (i18n.language !== state.language) {
                            i18n.changeLanguage(state.language);
                        }
                    });
                }
            },
        }
    )
);
