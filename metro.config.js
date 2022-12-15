// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
    "bloompub", // For sample books
    "htm", // For bloomplayer.htm
    // ENHANCE: We'd like to be able to bundle bloomplayer.min.js, but
    // adding the "js" or "javascript" extension breaks the build
    // (not too surprising in my opinion, since most Javascript files shouldn't be treated as assets)
    // For now, work around this by renaming the bloomplayer.min.js file to have .jsAsset extension.
    // Ideally, we could figure out a better workaround...
    "jsAsset"
);

module.exports = config;
