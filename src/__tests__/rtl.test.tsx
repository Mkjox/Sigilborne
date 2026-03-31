console.log('RTL TEST FILE EXECUTING');
import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';

describe('RTL Basic Test', () => {
    test('renders a view', () => {
        const { getByText } = render(
            React.createElement(View, {}, 
                React.createElement(Text, {}, 'Hello RTL')
            )
        );
        expect(getByText('Hello RTL')).toBeTruthy();
    });
});
