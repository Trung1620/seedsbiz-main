// babel.config.js (root)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin", // ✅ luôn để CUỐI
    ],
  };
};
