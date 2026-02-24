import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SpectralEffect, SpectralEffectType } from '../components/game/vfx/SpectralEffect';

interface VFXEffect {
    id: string;
    type: SpectralEffectType;
    x: number;
    y: number;
}

interface VFXContextType {
    triggerVFX: (type: SpectralEffectType, x: number, y: number) => void;
    onShakeRequest?: (intensity: number) => void;
    registerShakeHandler: (handler: (intensity: number) => void) => void;
}

const VFXContext = createContext<VFXContextType | undefined>(undefined);

export const VFXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [effects, setEffects] = useState<VFXEffect[]>([]);
    const [shakeHandler, setShakeHandler] = useState<((intensity: number) => void) | null>(null);

    const triggerVFX = useCallback((type: SpectralEffectType, x: number, y: number) => {
        const id = Math.random().toString(36).substring(7);
        setEffects(prev => [...prev, { id, type, x, y }]);
    }, []);

    const removeEffect = useCallback((id: string) => {
        setEffects(prev => prev.filter(e => e.id !== id));
    }, []);

    const registerShakeHandler = useCallback((handler: (intensity: number) => void) => {
        setShakeHandler(() => handler);
    }, []);

    const handleShake = useCallback((intensity: number) => {
        if (shakeHandler) {
            shakeHandler(intensity);
        }
    }, [shakeHandler]);

    return (
        <VFXContext.Provider value={{ triggerVFX, registerShakeHandler }}>
            <View style={styles.container}>
                {children}

                {/* VFX Overlay Layer */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {effects.map(effect => (
                        <SpectralEffect
                            key={effect.id}
                            type={effect.type}
                            x={effect.x}
                            y={effect.y}
                            onComplete={() => removeEffect(effect.id)}
                            onShake={handleShake}
                        />
                    ))}
                </View>
            </View>
        </VFXContext.Provider>
    );
};

export const useVFX = () => {
    const context = useContext(VFXContext);
    if (!context) {
        throw new Error('useVFX must be used within a VFXProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
