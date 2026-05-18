import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'button';

interface CustomTextProps extends RNTextProps {
    variant?: TextVariant;
    color?: string;
}

export const Text: React.FC<CustomTextProps> = ({
    variant = 'body',
    color = colors.text.primary,
    style,
    ...props
}) => {
    const variantStyle = textStyles[variant];

    // Flatten styles to audit and normalize any layout/font overrides
    const flatStyle = StyleSheet.flatten([variantStyle, { color }, style]) || {};

    // Global Safeguard: If using a custom font that already has a weight in its name,
    // normalize any conflicting inline fontWeight styles to 'normal' to prevent
    // React Native from silently failing and falling back to default system fonts.
    if (flatStyle.fontFamily && (
        flatStyle.fontFamily.includes('Bold') || 
        flatStyle.fontFamily.includes('SemiBold')
    )) {
        if (flatStyle.fontWeight && flatStyle.fontWeight !== 'normal' && flatStyle.fontWeight !== '400') {
            flatStyle.fontWeight = 'normal';
        }
    }

    return (
        <RNText
            style={flatStyle}
            {...props}
        />
    );
};
