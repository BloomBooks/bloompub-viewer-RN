import { Platform } from "react-native";
import {
    MD3LightTheme as DefaultTheme,
    MD3DarkTheme,
} from "react-native-paper";
import { Colors } from "./Colors";

// Note: These colors are not formally designed by John Hatton yet.
// Take them with a (big) grain of salt.
//
// Further Reading: https://callstack.github.io/react-native-paper/theming.html
export const bloomLightTheme = {
    ...DefaultTheme,
    // ENHANCE: Figure out all the other colors to customize
    colors: {
        ...DefaultTheme.colors,
        primary: Colors.bloomRed,
        // Copied from screenshots of green buttons on BR Android
        // Q1) Is that actually what we want?
        // Q2) Is a different color more idiomatic in iOS?
        tertiary: "#4cf63e",
        // Used by react-native-paper Snackbar (Similar to toasts). Copied from screenshots of toasts on BR Android
        onSurface: "#4d4d4d",
        // In BR Android, this color is used for Status bar, Header, DownloadProgressView, etc
        onBackground: "#4e4e4e",
    },
};

const bloomDarkThemeAndroid = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: Colors.bloomRed,
        // ENHANCE: Figure out all the other colors to customize
    },
};

const bloomDarkThemeIOS = {
    ...bloomDarkThemeAndroid,
    colors: {
        ...bloomDarkThemeAndroid.colors,
        // TODO: Add any iOS overrides below
    },
};

export const bloomDarkTheme =
    Platform.OS === "ios" ? bloomDarkThemeIOS : bloomDarkThemeAndroid;
