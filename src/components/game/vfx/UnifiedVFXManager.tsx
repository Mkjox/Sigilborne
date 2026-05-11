import React, { useMemo, useEffect, useState, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
    Canvas,
    Points,
    vec,
    Fill,
    RuntimeShader,
} from "@shopify/react-native-skia";
import Animated, {
    useSharedValue,
    useDerivedValue,
    withRepeat,
    withTiming,
    Easing,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    runOnJS,
} from "react-native-reanimated";
import { getGlobalEventBus } from '../../../engine/eventBus';
import { ShaderLibrary } from './ShaderLibrary';
import { getAdjustedDuration } from '../../../utils/animation';

const PARTICLE_COUNT = 25;

type VFXType = 'scorch' | 'boost' | 'revive' | 'frost' | 'fog' | 'damage' | 'heal' | 'none';

/**
 * UnifiedVFXManager: High-performance, event-driven VFX orchestrator.
 * Listens to the EventBus and manages a queue of visual effects.
 */
export const UnifiedVFXManager: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const [activeVFX, setActiveVFX] = useState<VFXType>('none');
    const vfxQueue = useRef<VFXType[]>([]);
    const isPlaying = useRef(false);

    // Reanimated values for driving the shaders/particles
    const vfxType = useSharedValue<VFXType>('none');
    const timeline = useSharedValue(0);
    const intensity = useSharedValue(0);

    // Static particle metadata
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            angle: (i / PARTICLE_COUNT) * Math.PI * 2,
            distance: 80 + Math.random() * 40,
            delay: (i / PARTICLE_COUNT) * 0.1 - 0.05,
            speed: 0.8 + Math.random() * 0.4,
        }));
    }, []);

    const playNextVFX = () => {
        if (vfxQueue.current.length === 0) {
            isPlaying.current = false;
            setActiveVFX('none');
            vfxType.value = 'none';
            return;
        }

        isPlaying.current = true;
        const next = vfxQueue.current.shift()!;
        setActiveVFX(next);
        vfxType.value = next;

        // Reset and Trigger
        intensity.value = 0;
        timeline.value = 0;
        
        intensity.value = withTiming(1, { duration: getAdjustedDuration(200) });

        let duration = 1000;
        let easing = Easing.out(Easing.quad);

        switch (next) {
            case 'scorch':
            case 'damage':
                duration = 800;
                break;
            case 'boost':
            case 'heal':
                duration = 1200;
                easing = Easing.inOut(Easing.ease);
                break;
            case 'revive':
                duration = 1500;
                break;
            case 'frost':
            case 'fog':
                // Weather effects persist or pulse longer
                duration = 3000;
                break;
        }

        timeline.value = withTiming(1, { duration: getAdjustedDuration(duration), easing }, (finished) => {
            if (finished) {
                intensity.value = withTiming(0, { duration: getAdjustedDuration(300) }, (f2) => {
                   if (f2) runOnJS(playNextVFX)();
                });
            }
        });
    };

    // EventBus Subscription
    useEffect(() => {
        const bus = getGlobalEventBus();
        
        const handleEvent = (event: any) => {
            let type: VFXType = 'none';
            
            switch (event.type) {
                case 'CARD_PLAYED':
                    if (event.payload.cardType === 'weather') {
                        type = event.payload.cardName.toLowerCase().includes('frost') ? 'frost' : 'fog';
                    }
                    break;
                case 'CARD_DESTROYED':
                    type = 'scorch';
                    break;
                case 'UNIT_BOOSTED':
                case 'HERO_ABILITY_USED':
                    type = 'boost';
                    break;
                case 'UNIT_DAMAGED':
                    type = 'damage';
                    break;
                case 'UNIT_HEALED':
                    type = 'heal';
                    break;
            }

            if (type !== 'none') {
                vfxQueue.current.push(type);
                if (!isPlaying.current) {
                    playNextVFX();
                }
            }
        };

        const unsubscribes = [
            bus.subscribe('CARD_PLAYED', handleEvent),
            bus.subscribe('CARD_DESTROYED', handleEvent),
            bus.subscribe('UNIT_DAMAGED', handleEvent),
            bus.subscribe('UNIT_BOOSTED', handleEvent),
            bus.subscribe('UNIT_HEALED', handleEvent),
            bus.subscribe('HERO_ABILITY_USED', handleEvent),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    // Physics & Rendering Logic (Hardware-Accelerated via Shared Values)
    const points = useDerivedValue(() => {
        const t = timeline.value;
        const type = vfxType.value;
        const centerX = width / 2;
        const centerY = height / 2;

        return particles.map(p => {
            let x = centerX;
            let y = centerY;
            const pT = (t + p.delay) % 1.0;

            if (type === 'scorch' || type === 'damage') {
                const drift = interpolate(t, [0.2, 1.0], [0, 150], Extrapolate.CLAMP);
                x += Math.cos(p.angle) * (p.distance + drift);
                y += Math.sin(p.angle) * (p.distance + drift);
            } else if (type === 'boost' || type === 'heal') {
                x = (p.id * (width / PARTICLE_COUNT)) + Math.sin(t * 8 + p.delay) * 20;
                y = height - interpolate(t, [0, 1], [0, 200], Extrapolate.CLAMP);
            } else if (type === 'revive') {
                const dist = interpolate(t, [0, 1], [120, 0], Extrapolate.CLAMP);
                x += Math.cos(p.angle) * dist;
                y += Math.sin(p.angle) * dist;
            } else if (type === 'frost' || type === 'fog') {
                x = (p.id * (width / PARTICLE_COUNT) + t * 50) % width;
                y = (p.distance + p.id * 10) % height;
            }

            return vec(x, y);
        });
    });

    const particleColor = useDerivedValue(() => {
        const type = vfxType.value;
        if (type === 'scorch' || type === 'damage') return "#ef4444";
        if (type === 'revive') return "#0ea5e9";
        if (type === 'boost' || type === 'heal') return "#34d399";
        return "#10b981";
    });

    const vfxUniforms = useDerivedValue(() => ({
        u_time: timeline.value * 5,
        u_resolution: [width, height],
        u_origin: [width / 2, height / 2],
        u_progress: timeline.value,
        u_intensity: intensity.value,
    }));

    const animatedStyle = useAnimatedStyle(() => {
        const t = timeline.value;
        const type = vfxType.value;
        let scale = 1;
        let shake = 0;

        if (type === 'scorch' || type === 'damage') {
            scale = interpolate(t, [0, 0.2, 0.4], [1, 0.9, 1.2], Extrapolate.CLAMP);
            shake = interpolate(t, [0.1, 0.3], [0, 10], Extrapolate.CLAMP);
        }

        return {
            opacity: intensity.value,
            transform: [
                { scale },
                { translateX: shake * (Math.random() - 0.5) * 2 },
            ],
        };
    });

    return (
        <Animated.View style={[styles.absolute, animatedStyle]} pointerEvents="none">
            <Canvas style={styles.absolute}>
                {activeVFX === 'fog' && <Fill><RuntimeShader source={ShaderLibrary.fog} uniforms={vfxUniforms} /></Fill>}
                {activeVFX === 'frost' && <Fill><RuntimeShader source={ShaderLibrary.frost} uniforms={vfxUniforms} /></Fill>}
                {(activeVFX === 'scorch' || activeVFX === 'damage') && <Fill><RuntimeShader source={ShaderLibrary.scorchPulse} uniforms={vfxUniforms} /></Fill>}
                {(activeVFX === 'boost' || activeVFX === 'heal') && <Fill><RuntimeShader source={ShaderLibrary.boostPulse} uniforms={vfxUniforms} /></Fill>}
                {activeVFX === 'revive' && <Fill><RuntimeShader source={ShaderLibrary.reviveRing} uniforms={vfxUniforms} /></Fill>}

                <Points
                    points={points}
                    mode="points"
                    color={particleColor}
                    strokeWidth={activeVFX === 'scorch' ? 4 : 2}
                />
            </Canvas>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    absolute: {
        ...StyleSheet.absoluteFillObject,
    },
});
