import React, { useMemo, useEffect } from 'react';
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
    withSpring,
    withSequence,
    withDelay,
} from "react-native-reanimated";
import { useGameStore } from '../../../store';
import { ShaderLibrary } from './ShaderLibrary';

const PARTICLE_COUNT = 20;

/**
 * UnifiedVFXManager: High-performance VFX orchestrator using Skia + Reanimated.
 * Handles Scorch, Boost, Revive, Frost, and Fog effects in a single Canvas.
 */
export const UnifiedVFXManager: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const currentVFX = useGameStore(state => state.currentVFX);

    // Shared Values for Animation Orchestration
    const time = useSharedValue(0);
    const progress = useSharedValue(0); // 0 to 1 for effect lifecycle
    const intensity = useSharedValue(0); // 1 for active, 0 for inactive
    const shake = useSharedValue(0);    // For screen shake (scorch)

    // Particle state (fixed count per effect for stability)
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            angle: (i / PARTICLE_COUNT) * Math.PI * 2,
            distance: 50 + Math.random() * 200,
            speed: 0.5 + Math.random() * 1.5,
            size: 2 + Math.random() * 4,
            delay: Math.random() * 0.5,
        }));
    }, []);

    // Global Time Clock
    useEffect(() => {
        time.value = withRepeat(
            withTiming(1000, { duration: 100000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    // Effect Lifecycle Orchestration
    useEffect(() => {
        // Reset progress on new effect
        progress.value = 0;

        if (currentVFX === 'none') {
            intensity.value = withTiming(0, { duration: 1500 });
            return;
        }

        // Enter Phase
        intensity.value = withTiming(1, { duration: 500 });

        // Effect-specific progressions
        switch (currentVFX) {
            case 'scorch':
                // Sharp impact phase
                progress.value = withTiming(1, {
                    duration: 1200,
                    easing: Easing.bezier(0.1, 0.9, 0.2, 1)
                });
                // Violent shake
                shake.value = withSequence(
                    withTiming(10, { duration: 50 }),
                    withRepeat(withTiming(-10, { duration: 50 }), 5, true),
                    withTiming(0, { duration: 200 })
                );
                break;
            case 'boost':
                // Steady optimistic flow
                progress.value = withRepeat(
                    withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                    -1,
                    false
                );
                break;
            case 'revive':
                // Symmetrical expansion ring
                progress.value = withTiming(1, {
                    duration: 2500,
                    easing: Easing.out(Easing.quad)
                });
                break;
            case 'frost':
            case 'fog':
                // Continuous sustain
                progress.value = withRepeat(
                    withTiming(1, { duration: 5000 }),
                    -1,
                    true
                );
                break;
        }
    }, [currentVFX]);

    // Particle Point Calculation (Worklet)
    const points = useDerivedValue(() => {
        return particles.map(p => {
            let x = width / 2;
            let y = height / 2;
            const pTime = (time.value + p.delay) % 10;

            if (currentVFX === 'scorch') {
                // Outward violent expansion
                const dist = p.distance * progress.value * p.speed;
                x += Math.cos(p.angle) * dist;
                y += Math.sin(p.angle) * dist;
            } else if (currentVFX === 'boost') {
                // Upward flowing energy
                x = (p.id * (width / PARTICLE_COUNT)) + Math.sin(time.value + p.delay) * 20;
                y = height + 100 - ((pTime * 200 * p.speed) % (height + 200));
            } else if (currentVFX === 'revive') {
                // Inward convergence
                const dist = p.distance * (1 - progress.value) * p.speed + 50;
                x += Math.cos(p.angle) * dist;
                y += Math.sin(p.angle) * dist;
            } else if (currentVFX === 'frost' || currentVFX === 'fog') {
                // Drifting environmental particles
                x = (p.id * (width / PARTICLE_COUNT) + time.value * 50 * p.speed) % width;
                y = (p.distance + Math.sin(time.value * 0.5 + p.delay) * 100) % height;
            }

            return vec(x, y);
        });
    }, [currentVFX, progress, time, width, height]);

    // Uniform Mappings
    const weatherUniforms = useDerivedValue(() => ({
        u_time: time.value,
        u_resolution: [width, height],
        u_intensity: intensity.value,
        u_color_primary: [0.06, 0.72, 0.51],
        u_color_secondary: [0.01, 0.05, 0.03],
    }));

    const burstUniforms = useDerivedValue(() => ({
        u_time: time.value,
        u_resolution: [width, height],
        u_origin: [width / 2, height / 2],
        u_progress: progress.value,
    }));

    // Shake integration for the view
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shake.value * (Math.random() - 0.5) * 2 }],
        opacity: intensity.value,
    }));

    // We rely on animatedStyle (opacity) to hide the component when intensity is 0.
    // This avoids reading .value during render.

    return (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
                {/* 1. WEATHER LAYER (Fog / Frost Shaders) */}
                {currentVFX === 'fog' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.fog} uniforms={weatherUniforms} />
                    </Fill>
                )}
                {currentVFX === 'frost' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.frost} uniforms={weatherUniforms} />
                    </Fill>
                )}

                {/* 2. BURST LAYER (Scorch / Revive Pulses) */}
                {currentVFX === 'scorch' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.scorchPulse} uniforms={burstUniforms} />
                    </Fill>
                )}
                {currentVFX === 'boost' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.boostPulse} uniforms={burstUniforms} />
                    </Fill>
                )}
                {currentVFX === 'revive' && (
                    <Fill>
                        <RuntimeShader source={ShaderLibrary.reviveRing} uniforms={burstUniforms} />
                    </Fill>
                )}

                {/* 3. PARTICLE LAYER (Dynamic Points) */}
                <Points
                    points={points}
                    mode="points"
                    color={currentVFX === 'scorch' ? "#10b981" : currentVFX === 'revive' ? "#0ea5e9" : "#10b981"}
                    strokeWidth={currentVFX === 'scorch' ? 4 : 2}
                />
            </Canvas>
        </Animated.View>
    );
};
