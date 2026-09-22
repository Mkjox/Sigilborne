import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
    Canvas,
    Points,
    vec,
    Fill,
    Group,
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

const PARTICLES_PER_BIOME = 18;
const BIOME_COUNT = 5;

type MotionParticle = {
    x: number;
    y: number;
    phase: number;
    speed: number;
    radius: number;
    focalX: number;
    focalY: number;
    direction: number;
};

const wrap = (value: number, size: number) => {
    "worklet";
    return ((value % size) + size) % size;
};

const clamp = (value: number, min: number, max: number) => {
    "worklet";
    return Math.min(max, Math.max(min, value));
};

// Biome Definitions are now imported from CampaignMapScreen

interface Props {
    scrollY: SharedValue<number>;
    totalHeight: number;
}

export const CampaignMapSkiaBackground: React.FC<Props> = ({ scrollY, totalHeight }) => {
    const { width, height } = useWindowDimensions();
    const time = useSharedValue(0);

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

    // Each biome gets its own sparse field so color is never the only distinction.
    const biomeParticles = useMemo(() => {
        return Array.from({ length: BIOME_COUNT }, (_, biomeIndex) => (
            Array.from({ length: PARTICLES_PER_BIOME }, (_, particleIndex) => ({
                x: Math.random() * width,
                y: Math.random() * (height + 240),
                phase: Math.random() * Math.PI * 2 + particleIndex * 0.37,
                speed: 0.55 + Math.random() * 0.8 + biomeIndex * 0.04,
                radius: 18 + Math.random() * Math.min(width, height) * 0.18,
                focalX: width * (0.25 + Math.random() * 0.5),
                focalY: height * (0.2 + Math.random() * 0.45),
                direction: Math.random() > 0.5 ? 1 : -1,
            }))
        )) as MotionParticle[][];
    }, [width, height]);

    const biomeWeights = Array.from({ length: BIOME_COUNT }, (_, biomeIndex) => useDerivedValue(() => {
        const biomePosition = clamp((scrollY.value / (totalHeight || 1)) * (BIOME_COUNT - 0.001), 0, BIOME_COUNT - 1);
        return Math.max(0, 1 - Math.abs(biomePosition - biomeIndex));
    }, [scrollY, totalHeight, biomeIndex]));

    const motionPoints = Array.from({ length: BIOME_COUNT }, (_, biomeIndex) => useDerivedValue(() => {
        const t = time.value;
        const particles = biomeParticles[biomeIndex];

        return particles.map((particle) => {
            const localTime = t * particle.speed + particle.phase;
            let x = particle.x;
            let y = particle.y;

            switch (biomeIndex) {
                case 0: { // Verdant: upward spores with layered organic sway.
                    const drift = Math.sin(localTime * 0.22) * 10 + Math.sin(localTime * 0.07 + particle.phase) * 5;
                    x += drift;
                    y = wrap(particle.y - t * (2.5 + particle.speed * 2.5), height + 240) - 120;
                    break;
                }
                case 1: { // Azure: clean vertical ascent with restrained orbital offsets.
                    const orbit = particle.radius * 0.16;
                    x = particle.x + Math.cos(localTime * 0.32) * orbit;
                    y = wrap(particle.y - t * (5 + particle.speed * 4), height + 240) - 120 + Math.sin(localTime * 0.32) * orbit * 0.35;
                    break;
                }
                case 2: { // Twilight: asymmetric orbits with occasional local displacement.
                    const orbitRadius = particle.radius * (0.7 + Math.sin(localTime * 0.13) * 0.22);
                    const pulse = Math.pow(Math.max(0, Math.sin(t * 0.42 + particle.phase)), 14);
                    x = particle.focalX + Math.cos(localTime * 0.23 + particle.direction) * orbitRadius + pulse * particle.direction * 24;
                    y = particle.focalY + Math.sin(localTime * 0.17 + particle.phase) * orbitRadius * 0.7 + pulse * 18;
                    break;
                }
                case 3: { // Crimson: accelerated rises, turbulent offsets, and short eruptions.
                    const cycle = (t * (0.035 + particle.speed * 0.012) + particle.phase / (Math.PI * 2)) % 1;
                    const burst = Math.pow(Math.max(0, Math.sin(t * 0.3 + particle.phase)), 12);
                    const rise = cycle * cycle;
                    x = particle.x + Math.sin(localTime * 0.8) * (7 + burst * 20) * particle.direction;
                    y = height + 80 - rise * (height + 260) - burst * 26;
                    break;
                }
                default: { // Obsidian: long stillness followed by a slow inward pull.
                    const cycle = (t * (0.008 + particle.speed * 0.002) + particle.phase / (Math.PI * 2)) % 1;
                    const pull = clamp((cycle - 0.58) / 0.36, 0, 1);
                    const easedPull = pull * pull * (3 - 2 * pull);
                    const angle = particle.phase + t * 0.035 * particle.direction;
                    if (cycle > 0.96) {
                        x = -100;
                        y = -100;
                    } else {
                        const orbitX = particle.x - particle.focalX;
                        const orbitY = particle.y - particle.focalY;
                        x = particle.focalX + orbitX * (1 - easedPull * 0.92) + Math.cos(angle) * easedPull * 5;
                        y = particle.focalY + orbitY * (1 - easedPull * 0.92) + Math.sin(angle) * easedPull * 5;
                    }
                    break;
                }
            }

            return vec(x, y);
        });
    }, [time, biomeParticles, width, height, biomeIndex]));

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

                {/* Sparse motion fields fade between adjacent biomes during scroll. */}
                <Group opacity={biomeWeights[0]}>
                    <Points points={motionPoints[0]} mode="points" color="rgba(110, 231, 183, 0.48)" strokeWidth={1.5} />
                </Group>
                <Group opacity={biomeWeights[1]}>
                    <Points points={motionPoints[1]} mode="points" color="rgba(103, 232, 249, 0.44)" strokeWidth={1.5} />
                </Group>
                <Group opacity={biomeWeights[2]}>
                    <Points points={motionPoints[2]} mode="points" color="rgba(216, 180, 254, 0.42)" strokeWidth={1.5} />
                </Group>
                <Group opacity={biomeWeights[3]}>
                    <Points points={motionPoints[3]} mode="points" color="rgba(248, 113, 113, 0.48)" strokeWidth={1.5} />
                </Group>
                <Group opacity={biomeWeights[4]}>
                    <Points points={motionPoints[4]} mode="points" color="rgba(203, 213, 225, 0.32)" strokeWidth={1.5} />
                </Group>
            </Canvas>
        </View>
    );
};
