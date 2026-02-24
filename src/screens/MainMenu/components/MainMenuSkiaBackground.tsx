import React, { useMemo } from 'react';
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
} from "react-native-reanimated";
import { ShaderLibrary } from '../../../components/game/vfx/ShaderLibrary';

const WISP_COUNT = 150;

/**
 * MainMenuSkiaBackground: A high-fidelity atmospheric backdrop for the main menu.
 * Replaces the Reanimated-based version with hardware-accelerated shaders.
 */
export const MainMenuSkiaBackground: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const time = useSharedValue(0);

    // Initial Wisp State
    const wisps = useMemo(() => {
        return Array.from({ length: WISP_COUNT }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * (height + 200),
            size: 1 + Math.random() * 2,
            speed: 0.1 + Math.random() * 0.4,
            offset: Math.random() * 100,
        }));
    }, [width, height]);

    // Derived wisp points (Upward drifting particles)
    const points = useDerivedValue(() => {
        return wisps.map(w => {
            const t = time.value * w.speed;
            const x = w.x + Math.sin(t * 0.2 + w.offset) * 30; // Horizontal sway
            const y = (w.y - t * 50) % (height + 200); // Continuous upward drift
            // Fix for modulo negative result in JS
            const wrappedY = y < 0 ? y + (height + 200) : y;
            return vec(x, wrappedY - 100);
        });
    }, [time, width, height]);

    // Global Time Clock
    React.useEffect(() => {
        time.value = withRepeat(
            withTiming(1000, { duration: 100000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    // Uniforms for the nebula background
    const nebulaUniforms = useDerivedValue(() => ({
        u_time: time.value * 0.5,
        u_resolution: [width, height],
    }), [width, height, time]);

    return (
        <View style={StyleSheet.absoluteFill}>
            <Canvas style={StyleSheet.absoluteFill}>
                {/* 1. Deep Void Nebula backdrop */}
                <Fill>
                    <RuntimeShader source={ShaderLibrary.voidNebula} uniforms={nebulaUniforms} />
                </Fill>

                {/* 2. High-Density Mana Wisps */}
                <Points
                    points={points}
                    mode="points"
                    color="rgba(16, 185, 129, 0.4)"
                    strokeWidth={2}
                />

                {/* 3. Bloom layers would go here if needed, 
                    but voidNebula already handles core glow */}
            </Canvas>
        </View>
    );
};

// Need View from react-native for the wrapper
import { View } from 'react-native';
