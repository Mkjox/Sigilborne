import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
    Canvas,
    Points,
    vec,
    Fill,
    RuntimeShader,
    Skia,
} from "@shopify/react-native-skia";
import Animated, {
    useSharedValue,
    useDerivedValue,
    withRepeat,
    withTiming,
    Easing,
    SharedValue,
    interpolateColor,
} from "react-native-reanimated";
import { ShaderLibrary } from '../../../components/game/vfx/ShaderLibrary';
import { MAP_BIOMES } from '../constants';

const PARTICLE_COUNT = 80;

// Biome Definitions are now imported from CampaignMapScreen

interface Props {
    scrollY: SharedValue<number>;
    totalHeight: number;
}

export const CampaignMapSkiaBackground: React.FC<Props> = ({ scrollY, totalHeight }) => {
    const { width, height } = useWindowDimensions();
    const time = useSharedValue(0);

    // Approximate total scroll content height (200 stages * ~114px node distance)
    const TOTAL_CONTENT_HEIGHT = 200 * 114;

    // Derived primary color based on scroll
    const primaryColor = useDerivedValue(() => {
        return interpolateColor(
            scrollY.value,
            MAP_BIOMES.map(b => (b.start / 200) * totalHeight),
            MAP_BIOMES.map(b => b.colors[0])
        );
    });

    // Derived secondary color (darker sky)
    const secondaryColor = useDerivedValue(() => {
        return interpolateColor(
            scrollY.value,
            MAP_BIOMES.map(b => (b.start / 200) * totalHeight),
            MAP_BIOMES.map(b => b.colors[1])
        );
    });

    // Hex to RGB Array for Shader
    const hexToRgb = (hex: string) => {
        "worklet";
        // Simple hex colors like '#ffffff' or names like 'emerald' 
        // Reanimated's interpolateColor returns 'rgba(r, g, b, a)' or 'rgb(r, g, b)'
        const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return [parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255];
        }
        return [0.02, 0.15, 0.1]; // Fallback
    };

    // Initial Dust State
    const dust = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * (height + 200),
            size: 0.5 + Math.random() * 1.5,
            speed: 0.05 + Math.random() * 0.15,
            offset: Math.random() * 100,
        }));
    }, [width, height]);

    // Derived dust points driven by biome physics
    const points = useDerivedValue(() => {
        // Calculate current biome progress (approximate)
        const progress = scrollY.value / (totalHeight || 1);
        const biomeIndex = Math.min(4, Math.floor(progress * 5));
        
        return dust.map(d => {
            const t = time.value * d.speed;
            let x = d.x;
            let y = d.y;
            
            // Apply unique physics based on active biome
            switch(biomeIndex) {
                case 0: // Verdant Echo: Organic sway
                    x += Math.sin(t * 0.1 + d.offset) * 15;
                    y = (d.y + t * 20) % (height + 200);
                    break;
                case 1: // Azure Spire: Falling frost
                    y = (d.y + t * 45) % (height + 200);
                    break;
                case 3: // Crimson Wake: Rising heat
                case 4: // Obsidian Heart: Rising embers
                    y = (d.y - t * 40) % (height + 200);
                    if (y < -100) y += (height + 300);
                    break;
                default: // Twilight Rift: Arcane turbulence
                    x += Math.cos(t * 0.2 + d.offset) * 25;
                    y = (d.y + Math.sin(t * 0.15) * 50) % (height + 200);
            }

            const wrappedY = y < -100 ? y + (height + 300) : y;
            return vec(x, wrappedY - 100);
        });
    }, [time, width, height, totalHeight]);

    // Global Time Clock
    React.useEffect(() => {
        time.value = withRepeat(
            withTiming(1000, { duration: 150000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    // Uniforms for the nebula
    const nebulaUniforms = useDerivedValue(() => ({
        u_time: time.value * 0.3,
        u_resolution: [width, height],
        u_color_primary: hexToRgb(primaryColor.value),
        u_color_secondary: hexToRgb(secondaryColor.value),
    }));

    // Uniforms for the ley lines (shifted version for parallax feel)
    const leyLineUniforms = useDerivedValue(() => ({
        u_time: time.value * 0.1,
        u_resolution: [width, height],
        u_color_primary: hexToRgb(primaryColor.value),
        u_color_secondary: hexToRgb(secondaryColor.value),
    }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
                {/* 1. Deep Void Nebula backdrop */}
                <Fill>
                    <RuntimeShader source={ShaderLibrary.voidNebula} uniforms={nebulaUniforms} />
                </Fill>

                {/* 2. Arcane Ley Lines (Subtle energy currents) */}
                <Fill opacity={0.3}>
                    <RuntimeShader 
                        source={ShaderLibrary.voidNebula} 
                        uniforms={leyLineUniforms} 
                    />
                </Fill>

                {/* 3. Arcane Dust particles */}
                <Points
                    points={points}
                    mode="points"
                    color={primaryColor as any}
                    strokeWidth={1.5}
                />
            </Canvas>
        </View>
    );
};
