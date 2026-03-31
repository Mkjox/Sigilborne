import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CardComponent } from '../CardComponent';
import { Card } from '../../../types';

// Mock Reanimated locally in the test file
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock Card Data
const mockCard: Card = {
    id: 'test-id',
    name: 'Test Unit',
    type: 'unit',
    power: 10,
    attack: 5,
    manaCost: 3,
    description: 'Unit description',
    abilities: [],
    rarity: 'common',
} as any;

describe('CardComponent', () => {
    test('renders card name and power', () => {
        const { getByText } = render(
            <CardComponent card={mockCard} width={100} height={140} />
        );

        // Name is rendered as uppercase
        expect(getByText('TEST UNIT')).toBeTruthy();
        expect(getByText('10')).toBeTruthy();
    });

    test('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <CardComponent card={mockCard} width={100} height={140} onPress={onPress} />
        );

        const cardElement = getByText('TEST UNIT');
        fireEvent.press(cardElement);

        expect(onPress).toHaveBeenCalled();
    });
});
