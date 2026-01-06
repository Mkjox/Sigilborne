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

    return (
        <RNText
            style={[
                variantStyle,
                { color },
                style,
            ]}
            {...props}
        />
    );
};
