import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';

// Screens
import { MainMenuScreen } from '../screens/MainMenu';
import { GameBoardScreen } from '../screens/GameBoard';
import { DeckBuilderScreen } from '../screens/DeckBuilder';
import { CollectionScreen } from '../screens/Collection';
import { SettingsScreen } from '../screens/Settings';
import { CampaignMapScreen, ShopScreen, TalentTreeScreen, EventScreen, LoreScreen } from '../screens/Campaign';

const Stack = createStackNavigator<RootStackParamList>();

// Dark theme for navigation
const navigationTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary[500],
        background: colors.background.primary,
        card: colors.background.secondary,
        text: colors.text.primary,
        border: colors.border.primary,
    },
};

export const RootNavigator: React.FC = () => {
    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
                initialRouteName="MainMenu"
                screenOptions={{
                    headerShown: false,
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                }}
            >
                <Stack.Screen
                    name="MainMenu"
                    component={MainMenuScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="GameBoard"
                    component={GameBoardScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="CampaignMap"
                    component={CampaignMapScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="DeckBuilder"
                    component={DeckBuilderScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="Collection"
                    component={CollectionScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="Shop"
                    component={ShopScreen}
                    options={{
                        animationEnabled: true,
                        presentation: 'modal',
                        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                    }}
                />
                <Stack.Screen
                    name="TalentTree"
                    component={TalentTreeScreen}
                    options={{
                        animationEnabled: true,
                        presentation: 'modal',
                        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                    }}
                />
                <Stack.Screen
                    name="Event"
                    component={EventScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
                <Stack.Screen
                    name="Lore"
                    component={LoreScreen}
                    options={{
                        animationEnabled: true,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
