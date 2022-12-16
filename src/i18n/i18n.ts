// TODO: FIX ME
//
// It looks like this probably requires a custom build
// Also, this package is deprecated. It suggests:
// "This library is deprecated in favor of react-native-localize.
//You can use react-native-localize with I18n-js (but also with react-intl, react-i18next, etc. The choice is yours!)"

// import I18n from "react-native-i18n";
// const en = require("./locales/en.json");
// const fr = require("./locales/fr.json");

// I18n.fallbacks = true;
// I18n.translations = { en, fr };
// I18n.defaultLocale = "en";
// // The advantage of this is we don't have to specify redundant strings in the .json files.
// // For example, we don't need "Email Error Log": "Email Error Log" in en.json.
// // And if we haven't specified a translation yet, we get English as a fallback.
// // But if we used an ID rather than a string, "EmailErrorLog" would become "Email error log".
// I18n.missingBehaviour = "guess";

// Strip off the dash and following from the locale to get lang code
export function currentLang(): string {
    return "en";
    //return I18n.currentLocale().replace(/-.*/, "");
}

// export default I18n;

// Temporary stand-in replacement for I18n that returns the english strings
export default class I18n {
    private static localizations: Record<string, string> = {
        "Bloom Reader": "Bloom Reader",
        Downloading: "Downloading...",
        BloomTooOld:
            "You need a newer version of Bloom editor to exchange data with this BloomReader",
        BloomReaderTooOld:
            "You need a newer version of BloomReader to exchange data with this sender",
        AlreadyHaveThisVersion: "Found %{title}, already have this version.",
        FoundNewVersion:
            "Found new version of %{title} from %{sender}, requesting…",
        FoundFile: "Found %{title} from %{sender}, requesting…",
        Done: "Done.",
        TransferFailed:
            "Something went wrong. If the source is still available, we'll try again soon.",
        LookingForAds:
            "Looking for book advertisements on WiFi network %{network}...",
        NoWifiConnected:
            "The device does not appear to be connected to a WiFi network.",
        UpdatingBookCollectionFormat:
            "Updating the format of your book collection...",
        CannotShare: "Sorry, can't share this file.",
        // Additional ones I added:
        // TODO: Not added to either en.json or fr.json
        "Open BloomPUB file": "Open BloomPUB file",
        "Release Notes": "Release Notes",
        "About Bloom Reader": "About Bloom Reader",
        "About Bloom": "About Bloom",
        "About SIL": "About SIL",
    };

    public static t(key: string): string {
        const localizedString = this.localizations[key];
        if (localizedString) {
            return localizedString;
        } else {
            return `${key} (localization not found)`;
        }
    }
}
