module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        env: {
            production: {
                plugins: ["react-native-paper/babel"], // reduces bundle size
            },
        },
        plugins: ["react-native-reanimated/plugin"],
    };
};
