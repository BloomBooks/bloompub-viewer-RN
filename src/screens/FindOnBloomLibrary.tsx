import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
    HeaderBackButton,
    HeaderBackButtonProps,
} from "@react-navigation/elements";
import * as React from "react";
import { FunctionComponent } from "react";
import {
    BackHandler,
    Platform,
    PlatformColor,
    SafeAreaView,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { z } from "zod";
import { LibraryScreenProps } from "../navigationTypes";
import WebView, {
    WebViewMessageEvent,
    WebViewNavigation,
} from "react-native-webview";
import { WithMessageZ } from "../externalContext";
import { WebViewProgressEvent } from "react-native-webview/lib/WebViewTypes";

export const LibraryScreen: FunctionComponent<LibraryScreenProps> = ({
    navigation,
}) => {
    const [canWebviewGoBack, setCanWebviewGoBack] = React.useState(false);

    const webViewRef = React.useRef<WebView>(null);

    // Besides height and width, the object also contains scale and fontsize,
    // should we ever have need of them.
    const windowSize = useWindowDimensions();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            height: windowSize.height,
            width: windowSize.width,
            backgroundColor: "#fff",
        },
    });

    const host = "https://bloomlibrary.org";
    //const host = "https://alpha.bloomlibrary.org";
    const libraryUrl = host + "/app-hosted-v1/langs";

    React.useEffect(() => {
        alert(
            "After downloading a book for offline reading, go back to the Home screen."
        );
    }, []);

    // Set up the header
    React.useEffect(() => {
        const onBackPress = () => {
            if (canWebviewGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true; // Android: prevent default behavior (exit app)
            } else if (navigation.canGoBack()) {
                navigation.goBack();
                return true; // Android: prevent default behavior (exit app)
            }
            return false; // Android: allow default behavior (exit app)
        };

        // Android's hardware back handler
        const hardwareBackHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        navigation.setOptions({
            // For the header back, it's also possible (possibly more idiomatic on iOS) to make this the previous title,
            // but I think that takes up too much room compared to "Back"
            headerBackTitle: "Back", // ENHANCE: i18n

            // Back button with custom onPress
            headerLeft: (props: HeaderBackButtonProps) => (
                <HeaderBackButton
                    {...props}
                    onPress={onBackPress}
                    labelVisible={Platform.OS === "ios"} // iOS customarily shows the label
                />
            ),

            headerRight: () => {
                if (!canWebviewGoBack) {
                    return undefined;
                }

                if (Platform.OS === "ios") {
                    return (
                        <Ionicons.Button
                            name="ios-home"
                            color={PlatformColor("linkColor", "black")}
                            backgroundColor={"white"}
                            onPress={navigation.popToTop}
                        />
                    );
                } else {
                    return (
                        <MaterialIcons.Button
                            name="home"
                            color={"black"}
                            backgroundColor={"white"}
                            onPress={navigation.popToTop}
                        />
                    );
                }
            },
        });

        return () => hardwareBackHandler.remove(); // Cleanup
    }, [navigation, canWebviewGoBack]);

    // Set the navigation title to the webview DOM's title
    // Inspired by https://github.com/react-native-webview/react-native-webview/issues/2378
    // Note: We observe the head instead of the title because I think when BloomLibrary updates the title,
    // I think it creates a new <title> object, so observing the initial one is no good.
    //
    // One might wonder if we can just use onNavigationStateChange, which provides the title.
    // It seems to give the outdated title a lot of times. It might be because the React code that updates the title
    // hasn't run at the time we receive the navigationStateChange event.
    const observeTitleChangeScript = `
const headDom = document.getElementsByTagName('head')[0];
let lastTitle = "";
const headObserver = new MutationObserver((mutationsList) => {
    if (document.title !== lastTitle) {
        lastTitle = document.title;
        window.ReactNativeWebView.postMessage(JSON.stringify({ messageType: "titleChange", title: document.title }));
    }
})
headObserver.observe(headDom, {
    childList: true
})
//window.ReactNativeWebView.postMessage(document.title)`;

    const onMessage = ({ nativeEvent }: WebViewMessageEvent) => {
        const parsedJson = JSON.parse(nativeEvent.data);
        const data = WithMessageZ.parse(parsedJson);

        switch (data.messageType) {
            case "titleChange":
                navigation.setOptions({
                    title: TitleChangeMessageZ.parse(parsedJson).title,
                });
                break;
        }
    };

    const onNavStateChange = (navState: WebViewNavigation) => {
        // For iOS
        setCanWebviewGoBack(navState.canGoBack);
    };

    const onLoadProgress = (event: WebViewProgressEvent) => {
        // For Android
        // (onNavigationStateChange doesn't work on Android with Single-Page-Apps like Bloom Library
        // but we can use onLoadProgress as a workaround instead.)
        //
        // in iOS, canGoBack doesn't seem to have the right value here, so just use onNavigationStateChange for iOS
        setCanWebviewGoBack(event.nativeEvent.canGoBack);
    };
    return (
        <SafeAreaView style={styles.container}>
            <WebView
                ref={webViewRef}
                // We start the browser showing this specialized page in BloomLibrary.
                source={{
                    uri: libraryUrl,
                }}
                injectedJavaScript={
                    observeTitleChangeScript +
                    "\ntrue; // note: this is required, or you'll sometimes get silent failures"
                }
                scalesPageToFit={true}
                automaticallyAdjustContentInsets={false}
                onMessage={onMessage}
                onNavigationStateChange={
                    Platform.OS === "ios" ? onNavStateChange : undefined
                }
                onLoadProgress={
                    Platform.OS === "android" ? onLoadProgress : undefined
                }
            />
        </SafeAreaView>
    );
};

const TitleChangeMessageZ = WithMessageZ.extend({
    messageType: z.literal("titleChange"),
    title: z.string(),
});

export default LibraryScreen;
