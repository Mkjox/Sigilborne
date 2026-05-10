import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  RoundedRect,
  SweepGradient,
  vec,
  BlurMask,
} from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from '../../../theme';

interface Props {
  width: number;
  height: number;
  borderRadius: number;
  borderWidth?: number;
}

/**
 * AnimatedLegendaryBorder: A high-fidelity animated border that uses a rotating 
 * sweep gradient to create a "chasing light" effect.
 */
export const AnimatedLegendaryBorder: React.FC<Props> = ({ 
  width, 
  height, 
  borderRadius, 
  borderWidth = 2 
}) => {
  if (!width || !height || width <= 0 || height <= 0) return null;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const center = useMemo(() => vec(width / 2, height / 2), [width, height]);

  const matrix = useDerivedValue(() => {
    const m3 = Skia.Matrix();
    m3.translate(center.x, center.y);
    m3.rotate(rotation.value);
    m3.translate(-center.x, -center.y);
    return m3;
  }, [rotation, center]);

  return (
    <View style={{ width, height, position: 'absolute', pointerEvents: 'none' }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <RoundedRect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={width - borderWidth}
          height={height - borderWidth}
          r={borderRadius}
          style="stroke"
          strokeWidth={borderWidth}
        >
          <SweepGradient
            c={center}
            colors={[
              'transparent',
              colors.arcane.emerald,
              'white',
              colors.arcane.emerald,
              'transparent'
            ]}
            matrix={matrix}
          />
          <BlurMask blur={2} style="solid" />
        </RoundedRect>
      </Canvas>
    </View>
  );
};

import { Skia } from "@shopify/react-native-skia";
