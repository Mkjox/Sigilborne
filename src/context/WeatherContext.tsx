import React, { createContext, useContext, useState, useCallback } from 'react';

export type WeatherType = 'none' | 'frost' | 'fog';
export type WeatherStatus = 'idle' | 'entering' | 'active' | 'exiting';

interface WeatherContextType {
    weatherType: WeatherType;
    status: WeatherStatus;
    setWeather: (type: WeatherType) => void;
    clearWeather: () => void;
    onStatusChange: (status: WeatherStatus) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [weatherType, setWeatherType] = useState<WeatherType>('none');
    const [status, setStatus] = useState<WeatherStatus>('idle');

    const setWeather = useCallback((type: WeatherType) => {
        if (type === weatherType) return;

        if (weatherType !== 'none') {
            // If already has weather, exit first
            setStatus('exiting');
            setTimeout(() => {
                setWeatherType(type);
                setStatus('entering');
            }, 1000); // Transition buffer
        } else {
            setWeatherType(type);
            setStatus('entering');
        }
    }, [weatherType]);

    const clearWeather = useCallback(() => {
        if (weatherType === 'none') return;
        setStatus('exiting');
        setTimeout(() => {
            setWeatherType('none');
            setStatus('idle');
        }, 1500);
    }, [weatherType]);

    const onStatusChange = useCallback((newStatus: WeatherStatus) => {
        setStatus(newStatus);
    }, []);

    return (
        <WeatherContext.Provider value={{ weatherType, status, setWeather, clearWeather, onStatusChange }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};
