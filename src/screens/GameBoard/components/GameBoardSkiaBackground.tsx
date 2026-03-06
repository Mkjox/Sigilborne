import React, { useMemo, useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
    Canvas,
    Rect,
    Points,
    vec,
    BlurMask,
    LinearGradient,
} from "@shopify/react-native-skia";
import {
    useSharedValue,
    useDerivedValue,
    withRepeat,
    withTiming,
    Easing,
} from "react-native-reanimated";

const SNOW_COUNT = 300;

/**
 * GameBoardSkiaBackground - "The Frost Wastes"
 * 
 * A harsh, cold, desolate environment. 
 * Features a deep navy background, a slow moving aurora glow, 
 * and hundreds of tiny, fast-moving snow particles streaking diagonally.
 */
export const GameBoardSkiaBackground: React.FC = () => {
    const { width, height } = useWindowDimensions();

    // Core animation clocks
    const snowTime = useSharedValue(0);
    const auroraTime = useSharedValue(0);

    const centerX = width / 2;

    // Initial State for the Blizzard (Snow particles)
    const snowflakes = useMemo(() => {
        return Array.from({ length: SNOW_COUNT }).map(() => ({
            x: Math.random() * (width * 1.5) - (width * 0.25), // Start wider than screen
            y: Math.random() * (height * 1.5) - (height * 0.25),
            // Fast diagonal movement (down and to the left)
            speedX: -(0.5 + Math.random() * 1.5),
            speedY: (1.5 + Math.random() * 4),
            offset: Math.random() * 1000,
            size: 1 + Math.random() * 2.5, // Tiny sharp particles
            opacity: 0.3 + Math.random() * 0.7,
        }));
    }, [width, height]);

    // Start infinite loops
    useEffect(() => {
        // Fast clock for the driving snow
        snowTime.value = withRepeat(
            withTiming(1000000, { duration: 10000000, easing: Easing.linear }),
            -1,
            false
        );

        // Very slow clock for the shifting Aurora
        // Goes from 0 to 1 and back
        auroraTime.value = withRepeat(
            withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    // Derive the Driving Snow Points
    const snowPoints = useDerivedValue(() => {
        return snowflakes.map(s => {
            const t = snowTime.value;
            // Linear movement based on speed
            const x = s.x + (t * s.speedX);
            const y = s.y + (t * s.speedY);

            // Wrap around logic. If it goes off bottom or left, warp to top/right
            const wrappedX = ((x % width) + width) % width;
            const wrappedY = ((y % height) + height) % height;

            // Add a very slight sway to make it natural, not perfectly straight lines
            const sway = Math.sin(t * 0.05 + s.offset) * 10;

            return vec(wrappedX + sway, wrappedY);
        });
    }, [snowTime, width, height]);

    // Derive Aurora Transform (Slow panning left and right)
    const auroraTransform = useDerivedValue(() => {
        // Move back and forth across a distance of width * 0.5
        const translateX = -width * 0.25 + (auroraTime.value * width * 0.5);
        return [
            { translateX },
            { rotate: Math.PI / 12 } // Slant it 15 degrees
        ];
    });

    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#02040a" }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>

                {/* 1. Deep Midnight Blue Base */}
                <Rect x={0} y={0} width={width} height={height} color="#040814" />

                {/* 2. The Aurora (Slow glowing bands of green and violet in the background) */}
                <Rect
                    x={-width}
                    y={-height * 0.5}
                    width={width * 3}
                    height={height * 2}
                    origin={vec(centerX, 0)}
                    transform={auroraTransform}
                >
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(width * 3, 0)}
                        colors={[
                            "rgba(4, 8, 20, 0)",       // Invisible edge
                            "rgba(16, 185, 129, 0.15)",// Faint Emerald
                            "rgba(139, 92, 246, 0.15)",// Faint Violet
                            "rgba(6, 182, 212, 0.1)",  // Faint Cyan
                            "rgba(4, 8, 20, 0)"        // Invisible edge
                        ]}
                        positions={[0, 0.25, 0.5, 0.75, 1]}
                    />
                    <BlurMask blur={80} style="normal" />
                </Rect>

                {/* 3. The Blizzard (Fast diagonal white particles in the foreground) */}
                <Points
                    points={snowPoints}
                    mode="points"
                    color="rgba(255, 255, 255, 0.4)" // Soft semi-transparent white
                    strokeWidth={2}
                    strokeCap="round"
                />
                <Points
                    points={snowPoints}
                    mode="points"
                    color="rgba(224, 242, 254, 0.8)" // High-opacity bright ice blue center dots
                    strokeWidth={1}
                    strokeCap="round"
                />

                {/* 4. Dark Board Center Readability Overlay 
                    Ensures the bright snow and aurora don't overwhelm the cards */}
                <Rect x={-width * 0.25} y={0} width={width * 1.5} height={height}>
                    <LinearGradient
                        start={vec(centerX, 0)}
                        end={vec(centerX, height)}
                        colors={[
                            'rgba(2, 4, 10, 0.3)',   // Top: Let more snow and aurora show
                            'rgba(2, 4, 10, 0.85)',  // Center: Substantial darkening for card readability
                            'rgba(2, 4, 10, 0.85)',  // Center: Substantial darkening for card readability
                            'rgba(2, 4, 10, 0.2)'    // Bottom: Let snow cross over hand
                        ]}
                        positions={[0, 0.25, 0.75, 1]}
                    />
                </Rect>
            </Canvas>
        </View>
    );
};