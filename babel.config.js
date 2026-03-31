module.exports = function (api) {
    console.log('BABEL CONFIG LOADED');
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-reanimated/plugin'],
    };
};
