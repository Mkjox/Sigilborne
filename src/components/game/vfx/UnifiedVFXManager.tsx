import React, { useMemo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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
} from "react-native-reanimated";
import { useGameStore } from '../../../store';
import { ShaderLibrary } from './ShaderLibrary';

const PARTICLE_COUNT = 20;

/**
 * UnifiedVFXManager: High-performance, strictly-timed VFX orchestrator.
 * Drives all effects (Scorch, Boost, Revive, Frost, Fog) from a single 0-1 timeline.
 */
export const UnifiedVFXManager: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const currentVFXSource = useGameStore(state => state.currentVFX);

    // We capture currentVFX in a shared value to avoid re-renders driving core logic
    const vfxType = useSharedValue(currentVFXSource);
    useEffect(() => {
        vfxType.value = currentVFXSource;
    }, [currentVFXSource]);

    const timeline = useSharedValue(0);
    const intensity = useSharedValue(0);

    // Static particle metadata (Angles/Distances)
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            angle: (i / PARTICLE_COUNT) * Math.PI * 2,
            distance: 80 + Math.random() * 40,
            delay: (i / PARTICLE_COUNT) * 0.1 - 0.05, // Uneven delays ±0.05
            speed: 0.8 + Math.random() * 0.4,
        }));
    }, []);

    // Effect Logic & Lifecycle
    useEffect(() => {
        if (currentVFXSource === 'none') {
            intensity.value = withTiming(0, { duration: 500 });
            timeline.value = withTiming(0, { duration: 500 });
            return;
        }

        // Reset and Trigger
        intensity.value = withTiming(1, { duration: 300 });

        switch (currentVFXSource) {
            case 'scorch':
                timeline.value = 0;
                timeline.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });
                break;
            case 'boost':
                timeline.value = withRepeat(
                    withTiming(1, { duration: 2000, easing: Easing.linear }),
                    -1,
                    false
                );
                break;
            case 'revive':
                timeline.value = 0;
                timeline.value = withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) });
                break;
            case 'frost':
                timeline.value = withRepeat(
                    withTiming(1, { duration: 6000, easing: Easing.linear }),
                    -1,
                    false
                );
                break;
            case 'fog':
                timeline.value = withRepeat(
                    withTiming(1, { duration: 10000, easing: Easing.linear }),
                    -1,
                    false
                );
                break;
        }
    }, [currentVFXSource]);

    // Derived Points (Hardware-Accelerated Physics)
    const points = useDerivedValue(() => {
        const t = timeline.value;
        const type = vfxType.value;
        const centerX = width / 2;
        const centerY = height / 2;

        return particles.map(p => {
            let x = centerX;
            let y = centerY;
            const pT = (t + p.delay) % 1.0;
            const cappedPT = pT < 0 ? 0 : pT;

            if (type === 'scorch') {
                // Decay phase (0.4 - 1.0)
                const drift = interpolate(t, [0.4, 1.0], [0, 120], Extrapolate.CLAMP);
                x += Math.cos(p.angle) * (p.distance + drift);
                y += Math.sin(p.angle) * (p.distance + drift);
            } else if (type === 'boost') {
                // Upward motion from bottom (height -> height-120)
                x = (p.id * (width / PARTICLE_COUNT)) + Math.sin(t * 10 + p.delay) * 15;
                y = height - interpolate(t, [0, 1], [0, 150], Extrapolate.CLAMP);
            } else if (type === 'revive') {
                // Inward convergence (80 -> 0)
                const dist = interpolate(t, [0, 1], [80, 0], Extrapolate.CLAMP);
                x += Math.cos(p.angle) * dist;
                y += Math.sin(p.angle) * dist;
            } else if (type === 'frost') {
                // Drift X: -20 -> 20, Y: 0 -> 10
                x += interpolate(t, [0, 1], [-20, 20]);
                y += interpolate(t, [0, 1], [0, 10]);
            } else if (type === 'fog') {
                // 3 layers split by particle ID
                const layerSpeed = p.id % 3 === 0 ? 50 : p.id % 3 === 1 ? 100 : 150;
                x = (p.id * (width / PARTICLE_COUNT) + t * layerSpeed) % width;
                y = (p.distance + p.id * 5) % height;
            }

            return vec(x, y);
        });
    });

    // Unified Particle Color Mapping
    const particleColor = useDerivedValue(() => {
        const type = vfxType.value;
        if (type === 'scorch') return "#ef4444"; // Vivid Red for destruction
        if (type === 'revive') return "#0ea5e9"; // Vivid Cyan for restoration
        if (type === 'boost') return "#34d399";  // Brighter Emerald for buffs
        if (type === 'frost') return "#bae6fd";  // Pale Ice Blue
        return "#059669"; // Deep Emerald for Fog/Base
    });

    // Uniform Mappings with strict interpolation
    const weatherUniforms = useDerivedValue(() => {
        const t = timeline.value;
        const type = vfxType.value;
        let pulse = 1;

        if (type === 'frost') {
            pulse = 0.7 + Math.sin(t * Math.PI * 2) * 0.3; // Oscillation
        } else if (type === 'fog') {
            pulse = 0.8 + Math.sin(t * Math.PI * 4) * 0.2; // Every 2-4 seconds roughly
        }

        return {
            u_time: t * 10,
            u_resolution: [width, height],
            u_intensity: intensity.value * pulse,
            u_color_primary: [0.1, 0.9, 0.6], // Brighter Emerald
            u_color_secondary: [0.02, 0.1, 0.08], // Brighter Secondary
        };
    });

    const burstUniforms = useDerivedValue(() => ({
        u_time: timeline.value * 5,
        u_resolution: [width, height],
        u_origin: [width / 2, height / 2],
        u_progress: timeline.value,
    }));

    // Dynamic scale/shake styles
    const animatedStyle = useAnimatedStyle(() => {
        const t = timeline.value;
        const type = vfxType.value;
        let scale = 1;
        let shake = 0;

        if (type === 'scorch') {
            // Anticipation (0-0.2: 1->0.85) -> Expansion (0.2-0.4: 0.85->1.4)
            scale = interpolate(t, [0, 0.2, 0.4, 0.6], [1, 0.85, 1.4, 1.4], Extrapolate.CLAMP);
            // Shake peak at impact (0.2-0.4)
            shake = interpolate(t, [0.15, 0.2, 0.4, 0.5], [0, 15, 10, 0], Extrapolate.CLAMP);
        } else if (type === 'boost') {
            scale = interpolate(t, [0, 0.5, 1], [0.8, 1.1, 1]);
        }

        return {
            opacity: intensity.value * (type === 'scorch' ? interpolate(t, [0.4, 1.0], [1, 0], Extrapolate.CLAMP) : 1),
            transform: [
                { scale },
                { translateX: shake * (Math.random() - 0.5) * 2 },
            ],
        };
    });

    return (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
                {/* 1. Shaders Layer */}
                {currentVFXSource === 'fog' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.fog} uniforms={weatherUniforms} />
                    </Fill>
                )}
                {currentVFXSource === 'frost' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.frost} uniforms={weatherUniforms} />
                    </Fill>
                )}
                {currentVFXSource === 'scorch' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.scorchPulse} uniforms={burstUniforms} />
                    </Fill>
                )}
                {currentVFXSource === 'boost' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.boostPulse} uniforms={burstUniforms} />
                    </Fill>
                )}
                {currentVFXSource === 'revive' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.reviveRing} uniforms={burstUniforms} />
                    </Fill>
                )}

                {/* 2. Particle Layer */}
                <Points
                    points={points}
                    mode="points"
                    color={particleColor}
                    strokeWidth={currentVFXSource === 'scorch' ? 4 : 2}
                />
            </Canvas>
        </Animated.View>
    );
};
