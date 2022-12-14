import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent, useEffect, useState } from "react";
import {
    ActivityIndicator,
    NativeSyntheticEvent,
    StyleSheet,
} from "react-native";
import { Banner, useTheme } from "react-native-paper";
import { WebView } from "react-native-webview";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { bloomPlayerAssets } from "../../autogenerated/BloomPlayerAssets";
import { Colors } from "../../constants/Colors";
import { BLOOM_PLAYER_FOLDER } from "../../constants/Locations";
import { bloomDarkTheme } from "../../constants/Theme";
import { MainStackParamList } from "../../navigationTypes";
import { openBookForReading } from "../../storage/BookStorage";
import * as ErrorLog from "../../util/ErrorLog";
import { copyAssetAsync, ensureFolderAsync } from "../../util/FileUtil";
import { Path } from "../../util/Path";

interface BookReaderProps {
    bloomPubPath: string;
    navigation: NativeStackNavigationProp<
        MainStackParamList,
        "BookReader",
        "MainStack"
    >;
}

const BLOOM_PLAYER_PATH = `${BLOOM_PLAYER_FOLDER}/bloomplayer.htm`;

export const BookReader: FunctionComponent<BookReaderProps> = (props) => {
    const [isBloomPlayerReady, setIsBloomPlayerReady] = useState(false);
    const [uri, setUri] = useState("");

    const [error, setError] = useState<string | null>(null);

    const theme = useTheme();

    //console.log('in BookReader');

    // Enhance: We only do the loadBloomPlayer useEffect once per component,
    // but every time we re-navigate to the Read screen, this will re-run. (I guess it's a new component?)
    // It'd be nice if it only ran once each time the app was opened.

    // Load Bloom Player assets
    useEffect(() => {
        // Copy Bloom Player from dist to cache
        // Both Android and iOS need this for separate reasons
        // Android:
        //   react-native-webview has a bug on Android where local URI sources print out the HTML as text instead of as HTML
        //   (See https://github.com/react-native-webview/react-native-webview/issues/428 and https://github.com/react-native-webview/react-native-webview/issues/518)
        //   To work around it, we copy the HTM from dist into an HTM in the cache folder,
        //   then point to the HTM path in the cache folder.
        // iOS
        //   Because of Webview's allowingReadAccessToURL prop,
        //   we want both Bloom Player and the book to be under the same directory, so we copy Bloom Player to the cache directory.
        const loadBloomPlayerAsync = async () => {
            // Clearing the Bloom Player folder is optional in production,
            // but useful in development to ensure we're starting from a clean folder.
            await FileSystem.deleteAsync(BLOOM_PLAYER_FOLDER, {
                idempotent: true,
            });
            await ensureBPFolderAsync();
            const copyPromises = bloomPlayerAssets.map((asset) => {
                const extension = asset.type === "jsAsset" ? "js" : asset.type;
                const destination = `${BLOOM_PLAYER_FOLDER}/${asset.name}.${extension}`;

                return copyAssetAsync({
                    asset,
                    to: destination,
                });
            });

            // ENHANCE: catch if Promise.all rejects.
            await Promise.all(copyPromises);

            setIsBloomPlayerReady(true);
        };
        loadBloomPlayerAsync();
    }, []);

    useEffect(() => {
        setError("");
        // Unzip .bloompub and returns the full path to the unzipped book's HTM file
        const loadBookAsync = async () => {
            // TODO: Consider if we can refactor safeOpenBookForReading() to use BookStorage.extractToTmp instead?
            /**
             * Component-specific wrapper around openBookForReading
             * that catches any error and sets up component-specific error handling.
             */
            const safeOpenBookForReading = async (bookFilePath: string) => {
                if (bookFilePath.includes("%")) {
                    // react-native-zip-archive throws an error if bookFilePath is a valid percent-encoded URL.
                    // It would be understandable to throw an error on invalid URL's that contain percent chucked into random places,
                    // but these appear to be a valid URL, and Expo FileSystem doesn't crash on them
                    //
                    // To work around this, rename them to something without percent signs before passing them to react-native-zip-archive
                    bookFilePath = Path.join(
                        FileSystem.cacheDirectory!,
                        "temp.bloompub"
                    );

                    try {
                        await FileSystem.copyAsync({
                            from: props.bloomPubPath,
                            to: bookFilePath,
                        });
                    } catch (err) {
                        console.warn(err);
                        setError(
                            "Failed to prepare book: " +
                                bookFilePath +
                                ".\n" +
                                err
                        );
                        return null;
                    }
                }

                try {
                    const result = await openBookForReading(bookFilePath);
                    if (result === "failed") {
                        setError("Failed to unzip book");
                        return null;
                    }
                    return result;
                } catch (err) {
                    FileSystem.getInfoAsync(bookFilePath).then((value) => {
                        console.log("FileInfo: " + JSON.stringify(value));
                    });
                    console.warn(`[${bookFilePath}]: ${err}`);

                    if (err instanceof Error) {
                        setError(err.toString());
                    } else {
                        setError("Failed to unzip book " + bookFilePath);
                    }
                    return null;
                }
            };

            const unzippedBookFolderPath = await safeOpenBookForReading(
                props.bloomPubPath
            );

            if (unzippedBookFolderPath === null) {
                return;
            }
            console.log("unzippedbook at: " + unzippedBookFolderPath);

            const directoryContents = await FileSystem.readDirectoryAsync(
                "file://" + unzippedBookFolderPath
            );
            const htmFiles = directoryContents.filter((filename) =>
                filename.endsWith(".htm")
            );
            if (htmFiles.length === 0) {
                setError("Couldn't find any HTM files in book");
            }
            const htmFilename = htmFiles[0];
            console.log("htmFilename: " + htmFilename);

            // Generate the full path to the HTM file as a file:// protocol URL.
            // Note that htmFilename gives the true filename, but if it contains special punctuation,
            // it's not ready to be used as-is to go into a file:// URL. Encoding is needed.
            const bookHtmPath = Path.join(
                unzippedBookFolderPath,
                encodeURIComponent(htmFilename)
            );
            console.log("bookHtmPath: " + bookHtmPath);

            return bookHtmPath;
        };

        const setUriFromBookHtmPath = (bookHtmPath: string | undefined) => {
            if (!bookHtmPath) {
                return;
            }

            // The query params that come after the "?" in a bloomPlayer URL
            const bloomPlayerParams: Record<string, string> = {
                url: bookHtmPath,
                centerVertically: "true",
                showBackButton: "true",
                independent: "false",
                host: "bloomreaderlite",
            };
            // Additional params that might possibly be useful, or might not
            // &useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false
            const queryParamsString = Object.entries(bloomPlayerParams)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join("&");

            const bloomPlayerUri = `${BLOOM_PLAYER_PATH}?${queryParamsString}`;
            console.log("Read uri: " + bloomPlayerUri);
            setUri(bloomPlayerUri);
        };

        loadBookAsync().then(setUriFromBookHtmPath);
    }, [props.bloomPubPath]);

    function onMessageReceived(event: NativeSyntheticEvent<WebViewMessage>) {
        try {
            if (!event.nativeEvent || !event.nativeEvent.data) {
                // At startup we get a completely spurious
                // message, the source of which I have not been able to track down.
                // However, since it doesn't have any data format we expect, we can easily ignore it.
                return;
            }

            const data = JSON.parse(event.nativeEvent.data);
            switch (data.messageType) {
                // case "sendAnalytics":
                //     onAnalyticsEvent(data);
                //     break;
                case "logError":
                    ErrorLog.logError({
                        logMessage: data.message,
                    });
                    break;
                // case "requestCapabilities":
                //     this.webview!.postMessage(
                //         JSON.stringify({
                //             messageType: "capabilities",
                //             canGoBack: true,
                //         })
                //     );
                //     break;
                case "backButtonClicked":
                    props.navigation.goBack();
                    break;
                // case "bookStats":
                //     onBookStats(data);
                //     break;
                // case "pageShown":
                //     onPageShown(data);
                //     break;
                // case "audioPlayed":
                //     onAudioPlayed(data);
                //     break;
                // case "videoPlayed":
                //     onVideoPlayed(data);
                //     break;
                default:
                    ErrorLog.logError({
                        logMessage:
                            "BookReader.onMessageReceived() does not understand the messageType on this event: " +
                            JSON.stringify(event, getStringifyReplacer()),
                    });
            }

            // Next step: should also handle message type storePageData. The data object will also
            // have a key and a value, both strings. We need to store them somewhere that will
            // (at least) survive rotating the phone, and ideally closing and re-opening the book;
            // but it should NOT survive downloading a new version of the book. Whether there's some
            // other way to get rid of it (for testing, or for a new reader) remains to be decided.
            // Once the data is stored, it needs to become part of the reader startup to give it
            // back to the reader using window.sendMessage(). BloomPlayer is listening for a message
            // with messageType restorePageData and pageData an object whose fields are the key/value
            // pairs passed to storePageData. See the event listener in boom-player's externalContext
            // file.
        } catch (e) {
            ErrorLog.logError({
                logMessage:
                    "BookReader.onMessageReceived() does not understand this event: " +
                    event.nativeEvent.data,
            });
        }
    }

    // function onAudioPlayed(data: any) {
    //     const duration = data.duration;
    //     this.totalAudioDuration += duration;
    //     if (!this.reportedAudioOnCurrentPage) {
    //         this.reportedAudioOnCurrentPage = true;
    //         this.audioPages++;
    //     }
    // }

    // function onVideoPlayed(data: any) {
    //     const duration = data.duration;
    //     this.totalVideoDuration += duration;
    //     if (!this.reportedVideoOnCurrentPage) {
    //         this.reportedVideoOnCurrentPage = true;
    //         this.videoPages++;
    //     }
    // }

    // function onPageShown(data: any) {
    //     this.lastNumberedPageWasRead =
    //         this.lastNumberedPageWasRead || data.lastNumberedPageWasRead;
    //     this.totalPagesShown++;
    //     this.reportedAudioOnCurrentPage = this.reportedVideoOnCurrentPage = false;
    // }

    // function onBookStats(data: any) {
    //     this.totalNumberedPages = data.totalNumberedPages;
    //     this.questionCount = data.questionCount;
    //     this.contentLang = data.contentLang;
    //     var book = this.book();
    //     if (book.bloomdVersion === 0) {
    //         // the only feature that I expect might already be known is talkingBook; this is figured out
    //         // mainly based on the existence of audio files while attempting to read features from meta.json.
    //         // However, in debugging I've encountered a case where 'blind' was also listed. So using indexOf
    //         // is safest.
    //         const isTalkingBook =
    //             book.features.indexOf(BookFeatures.talkingBook) >= 0;
    //         // Now that we have the information from the player parsing the book, we can update
    //         // some other features that it figures out for legacy books.
    //         // Note: the order of features here matches Bloom's BookMetaData.Features getter,
    //         // so the features will be in the same order as when output from there.
    //         // Not sure whether this matters, but it may make analysis of the data easier.
    //         book.features = [];
    //         if (data.blind) {
    //             book.features.push(BookFeatures.blind);
    //         }
    //         if (data.signLanguage) {
    //             book.features.push(BookFeatures.signLanguage);
    //         }
    //         if (isTalkingBook) {
    //             book.features.push(BookFeatures.talkingBook);
    //         }
    //         if (data.motion) {
    //             book.features.push(BookFeatures.motion);
    //         }
    //     }
    //     var args = {
    //         title: book.title,
    //         totalNumberedPages: this.totalNumberedPages,
    //         questionCount: this.questionCount,
    //         contentLang: this.contentLang,
    //         features: book.features.join(","),
    //         sessionId: this.sessionId,
    //         brandingProjectName: book.brandingProjectName,
    //     };
    //     if (!book.brandingProjectName) {
    //         delete args.brandingProjectName;
    //     }
    //     BRAnalytics.reportLoadBook(args);
    // }

    // // Handle an anlytics event. data is the result of parsing the json received
    // // in the message. It should have properties event and params, the analytics
    // // event to track and the params to send.
    // function onAnalyticsEvent(data: any) {
    //     try {
    //         const eventName = data.event;
    //         const params = data.params;
    //         if (eventName === "comprehension") {
    //             // special case gets converted to match legacy comprehension question analytics
    //             BRAnalytics.track("Questions correct", {
    //                 questionCount: params.possiblePoints,
    //                 rightFirstTime: params.actualPoints,
    //                 percentRight: params.percentRight,
    //                 title: this.book().title,
    //             });
    //         } else {
    //             params.title = this.book().title;
    //             BRAnalytics.track(eventName, params);
    //         }
    //     } catch (ex) {
    //         ErrorLog.logError({
    //             logMessage: "BookReader.onAnalyticsEvent error: " + ex,
    //         });
    //     }
    // }

    const isLoading = uri === "" || !isBloomPlayerReady;

    const postMessageWorkaroundJavascript = `
window.postMessage = function(data) {
    window.ReactNativeWebView.postMessage(data);
};`;

    return (
        <>
            {error ? (
                <Banner
                    visible={!!error}
                    actions={[
                        {
                            label: "Back",
                            onPress: () => {
                                if (props.navigation.canGoBack()) {
                                    props.navigation.goBack();
                                } else {
                                    props.navigation.popToTop();
                                }
                            },
                        },
                    ]}
                    theme={{
                        ...bloomDarkTheme,
                        colors: {
                            ...bloomDarkTheme.colors,
                            onSurface: bloomDarkTheme.colors.error,
                        },
                    }}
                    contentStyle={{
                        backgroundColor: theme.colors.onBackground,
                    }}
                >
                    An error occurred: {error}
                </Banner>
            ) : (
                <>
                    {isLoading ? (
                        <ActivityIndicator color={Colors.bloomRed} />
                    ) : (
                        <WebView
                            style={styles.webViewStyles}
                            source={{ uri }}
                            injectedJavaScript={
                                postMessageWorkaroundJavascript +
                                "\ntrue; // note: this is required, or you'll sometimes get silent failures"
                            }
                            scalesPageToFit={true}
                            automaticallyAdjustContentInsets={false}
                            javaScriptEnabled={true}
                            allowFileAccess={true} // Needed for Android to access the bloomplayer.htm in cache dir
                            allowFileAccessFromFileURLs={true} // Needed to load the book's HTM. allowUniversalAccessFromFileURLs is fine too.
                            originWhitelist={["*"]} // Some widgets need this to load their content
                            // allowingReadAccessToURL is an iOS only prop.
                            // At a high level, under many conditions, file:// requests other than the {source URI} won't work unless its path or a parent directory path
                            // is granted explicit access via allowingReadAccessToURL
                            // If the source is a file:// URI
                            //    If this prop is NOT specified, then Webkit (iOS) only gives access to the source URI by default.
                            //    If this prop IS specified, then Webkit (iOS) gives access to the path specified by this prop
                            //       Beware: It seems that if Source URI is not under this path, then the Source URI won't be loaded at all!
                            // If the source is a http:// URI
                            //    It seems that no file:// URI's can be loaded, regardless of what allowingReadAccessToUrl says
                            //    During development, the assets are served via http:// to the development machine,
                            //       so using a mix of http:// for Bloom Player and file:// for the book is highly problematic!
                            //       An easy way to resolve this is to serve Bloom Player via file:// from the cache directory, same as the book.
                            allowingReadAccessToURL={FileSystem.cacheDirectory!}
                            onMessage={onMessageReceived}
                            mediaPlaybackRequiresUserAction={false}
                            //
                            // BloomReader-RN used these, but not sure if they're needed or not
                            // domStorageEnabled={true}
                            // mixedContentMode="always"
                            // allowUniversalAccessFromFileURLs={true}
                        />
                    )}
                </>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    webViewStyles: {
        flex: 1,
    },
});

async function ensureBPFolderAsync() {
    return ensureFolderAsync(BLOOM_PLAYER_FOLDER);
}

export default BookReader;
