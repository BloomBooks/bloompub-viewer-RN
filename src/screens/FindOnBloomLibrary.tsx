import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
    HeaderBackButton,
    HeaderBackButtonProps,
} from "@react-navigation/elements";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent } from "react";
import {
    BackHandler,
    Platform,
    PlatformColor,
    SafeAreaView,
    useWindowDimensions,
} from "react-native";
import { z } from "zod";
import { LibraryScreenProps } from "../navigationTypes";
import WebView, {
    WebViewMessageEvent,
    WebViewNavigation,
} from "react-native-webview";
import { WithMessageZ } from "../externalContext";
import {
    FileDownloadEvent,
    WebViewProgressEvent,
} from "react-native-webview/lib/WebViewTypes";
import { ensureFolderAsync } from "../util/FileUtil";
import { Path } from "../util/Path";
import { Locations } from "../constants/Locations";
import { Snackbar } from "react-native-paper";
import { DownloadProgressView } from "../components/DownloadProgressView";
import EStyleSheet from "react-native-extended-stylesheet";
import { Spacing } from "../constants/Spacing";

export const LibraryScreen: FunctionComponent<LibraryScreenProps> = ({
    navigation,
}) => {
    const [canWebviewGoBack, setCanWebviewGoBack] = React.useState(false);
    const [downloadStarted, setDownloadStarted] = React.useState(false);
    const [downloadProgress, setDownloadProgress] = React.useState(0);
    const [downloadComplete, setDownloadComplete] = React.useState(false);
    const [downloadBookTitle, setDownloadBookTitle] = React.useState("");
    const [downloadDestination, setDownloadDestination] = React.useState("");
    const [downloadResumable, setDownloadResumable] = React.useState<
        FileSystem.DownloadResumable | undefined
    >(undefined);

    const webViewRef = React.useRef<WebView>(null);

    // Besides height and width, the object also contains scale and fontsize,
    // should we ever have need of them.
    const windowSize = useWindowDimensions();

    const styles = EStyleSheet.create({
        container: {
            flex: 1,
            height: windowSize.height,
            width: windowSize.width,
            backgroundColor: "#fff",
        },
        snackbar: {
            bottom: "4.5rem",
            marginHorizontal: Spacing.ExtraLarge,
            // ENHANCE: In BR Android, this slightly overlaps DownloadProgressView,
            // appears above it, and the overlapping area has an even darker color.
        },
        hidden: {
            display: "none",
        },
    });

    // const host = "https://bloomlibrary.org";
    // const host = "https://alpha.bloomlibrary.org";
    const host = "https://dev-alpha.bloomlibrary.org";
    const libraryUrl = host + "/app-hosted-v1/langs";

    React.useEffect(() => {
        if (Platform.OS === "ios") {
            return;
        }

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

    const downloadBookAsync = async (bloomPubUrl: string) => {
        const fileName = Path.getFileName(bloomPubUrl);

        // What if fileName contains "+" symbols instead of spaces?
        // Well, I figure it's going to get used as a file:// protocol URL for a while still,
        // so probably better to keep them encoded as "+" indefinitely,
        // at least until something user-presentable needs to be generated.

        // Ensure it ends with .bloompub, if it doesn't already.
        // (e.g. older ".bloomd" format)
        const bloomPubFileName = Path.changeExtension(fileName, "bloompub");
        await ensureFolderAsync(Locations.BooksFolder);
        const filePath = Path.join(Locations.BooksFolder, bloomPubFileName);
        setDownloadDestination(filePath);

        const decodedTitle = decodeURIComponent(getTitleFromName(fileName));
        setDownloadBookTitle(decodedTitle);

        const onProgressCallback = (downloadProgress: {
            totalBytesWritten: number;
            totalBytesExpectedToWrite: number;
        }) => {
            const { totalBytesWritten, totalBytesExpectedToWrite } =
                downloadProgress;
            if (totalBytesExpectedToWrite === 0) {
                // Paranoia
                if (totalBytesWritten >= totalBytesExpectedToWrite) {
                    setDownloadProgress(1); // I guess it's technically completed?
                } else {
                    setDownloadProgress(0);
                }

                return;
            }

            const progress = totalBytesWritten / totalBytesExpectedToWrite;
            setDownloadProgress(progress);
        };
        setDownloadStarted(true);
        const resumableDownload = FileSystem.createDownloadResumable(
            bloomPubUrl,
            filePath,
            undefined,
            onProgressCallback
        );
        setDownloadResumable(resumableDownload);
        const downloadResult = await resumableDownload.downloadAsync();

        if (!downloadResult) {
            // maybe cancelled?
            return;
        }
        console.assert(downloadResult.status === 200);

        setDownloadComplete(true);
        setDownloadProgress(1.0); // just in case
        setDownloadResumable(undefined);
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
                onFileDownload={async (event: FileDownloadEvent) => {
                    // This function only gets called on iOS.
                    return downloadBookAsync(event.nativeEvent.downloadUrl);
                }}
            />
            {/* ENHANCE: The toast in BR Android includes a logo as well. */}
            <Snackbar
                style={[styles.snackbar]}
                visible={downloadComplete}
                elevation={4}
                onDismiss={() => {
                    setDownloadComplete(false);
                }}
            >
                {`${downloadBookTitle} added or updated`}
            </Snackbar>
            <DownloadProgressView
                visible={downloadStarted}
                message={
                    !downloadComplete
                        ? `Downloading ${downloadBookTitle}`
                        : "Book download is complete"
                }
                progress={downloadProgress}
                loadingAction={{
                    label: "Cancel",
                    onPress: async () => {
                        if (!downloadResumable) {
                            return;
                        }
                        await downloadResumable.cancelAsync();

                        setDownloadResumable(undefined);
                        setDownloadStarted(false);
                        setDownloadProgress(0);
                    },
                }}
                doneAction={{
                    label: "Read Now",
                    onPress: () => {
                        navigation.navigate("Read", {
                            bookUrl: downloadDestination,
                        });
                    },
                }}
            />
        </SafeAreaView>
    );
};

const TitleChangeMessageZ = WithMessageZ.extend({
    messageType: z.literal("titleChange"),
    title: z.string(),
});

// A translation of BloomReader's DownloadProgressView's titleFromName
const getTitleFromName = (name: string) => {
    // Filenames from BL commonly contain plus signs for spaces.
    // Nearly always things will be more readable if we replace them.
    // A sequence of three plus signs might indicate that the name really had a plus sign.
    // But it might equally indicate a sequence of undesirable characters that each got
    // changed to a space to make a file name. (We had some code briefly to treat three
    // plus signs specially, but got bad results for an Adangbe book called "Bɔ++++kuu.bloompub".)
    let result = name.replace(/\+/, " ");
    // The above might just possibly have produced a sequence of several spaces.
    while (result.indexOf("  ") >= 0) result = result.replace("  ", " ");
    // We don't need a file extension in the name.
    result = result.replace(".bloompub", "").replace(".bloomd", "");
    return result;
};
export default LibraryScreen;
