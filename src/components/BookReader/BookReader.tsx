import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent, useEffect, useState } from "react";
import {
    ActivityIndicator,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    Text,
} from "react-native";
import { WebView } from "react-native-webview";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { Colors } from "../../constants/Colors";
import { RootStackParamList } from "../../navigationTypes";
import { openBookForReading, OPEN_BOOK_DIR } from "../../storage/BookStorage";
import * as ErrorLog from "../../util/ErrorLog";
import { copyAssetAsync, readAssetContentsAsync } from "../../util/FileUtil";

interface BookReaderProps {
    bloomPubPath: string;
    navigation: NativeStackNavigationProp<
        RootStackParamList,
        "Read",
        "PUBViewer"
    >;
}

const ANDROID_BLOOM_PLAYER_FOLDER = FileSystem.cacheDirectory + "bloomPlayer";
const ANDROID_BLOOM_PLAYER_PATH = `${ANDROID_BLOOM_PLAYER_FOLDER}/bloomplayer.htm`;

export const BookReader: FunctionComponent<BookReaderProps> = (props) => {
    const [bloomPlayerHtmReady, setBloomPlayerHtmReady] = useState(
        Platform.OS !== "android"
    );
    const [bloomPlayerJS, setBloomPlayerJS] = useState("");
    const [bookHtmPath, setBookHtmPath] = useState("");
    const [uri, setUri] = useState("");

    const [error, setError] = useState<string | null>(null);

    //console.log('in BookReader');
    // react-native-webview has a bug on Android where local URI sources print out the HTML as text instead of as HTML
    // (See https://github.com/react-native-webview/react-native-webview/issues/428 and https://github.com/react-native-webview/react-native-webview/issues/518)
    // To work around it, we copy the HTM from dist into an HTM in the cache folder,
    // then point to the HTM path in the cache folder.
    const baseUri =
        Platform.OS === "android"
            ? ANDROID_BLOOM_PLAYER_PATH + "?"
            : Asset.fromModule(
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  require("../../../dist/bloom-player/bloomplayer.htm")
              ).uri;

    useEffect(() => {
        // Unzip .bloompub and get the path to the HTM file inside the .bloompub
        const openBookFromStorageAsync = async () => {
            let unzippedBookFolderPath = await openBookForReading(
                props.bloomPubPath
            );
            if (unzippedBookFolderPath === "failed") {
                setError("Failed to unzip book");
                return;
            }
            console.log("unzippedbook at: " + unzippedBookFolderPath);
            if (Platform.OS === "android") {
                // TODO: check to see if this is necessary on ios or not, might not be...
                unzippedBookFolderPath = "file://" + unzippedBookFolderPath;
            }

            // let directoryContents: string[] = [];
            // try {
            //     const dirInfo = await FileSystem.getInfoAsync(
            //         unzippedBookFolderPath
            //     );
            //     if (dirInfo.isDirectory) {
            //         console.log("Is a directory! size is:" + dirInfo.size);
            //     }
            const directoryContents = await FileSystem.readDirectoryAsync(
                unzippedBookFolderPath
            );
            // } catch (error) {
            //     console.error(`readDirectoryAsync error: ${error}`);
            // }
            // console.log(
            //     "directoryContents: " + JSON.stringify(directoryContents)
            // );
            const htmFiles = directoryContents.filter((filename) =>
                filename.endsWith(".htm")
            );
            if (htmFiles.length > 0) {
                const htmPath = htmFiles[0];
                console.log("bookHtmPath: " + htmPath);
                setBookHtmPath(htmPath);
            } else {
                setError("Couldn't find any HTM files in book");
            }
        };
        openBookFromStorageAsync();
    }, []);

    useEffect(
        () => {
            if (bookHtmPath === "") return; // not ready yet
            //const dirLessFile = OPEN_BOOK_DIR.substring(7); // experimented with 7 and 8 here
            //const encodedPath = encodeURI(`${dirLessFile}/${bookHtmPath}`);
            const encodedPath = encodeURI(`${OPEN_BOOK_DIR}/${bookHtmPath}`);
            const uri = `${baseUri}&url=${encodedPath}&centerVertically=true&showBackButton=true&independent=false&host=bloompubviewer`;

            // TODO: Are any of these params desired?
            // &useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false

            console.log("Read uri: " + uri);
            setUri(uri);
            const loadBloomPlayerAssetAsync = async () => {
                // Since I could't get the script referenced in the HTM file to run,
                // I just read it out and inject it via props instead to start its execution.
                //
                // ENHANCE: The old script tag is still in the HTML and will print out an error message
                // in the console. A minor annoyance.

                const bloomPlayerJSAsset = Asset.fromModule(
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    require("../../../dist/bloom-player/bloomPlayerMin.jsAsset")
                );
                const jsFileContents = await readAssetContentsAsync(
                    bloomPlayerJSAsset
                );

                // window.postMessage is deprecated, need window.ReactNativeWebView now instead. See https://stackoverflow.com/a/57227576
                const postMessageWorkaroundJavascript = `\n
(function() {
    window.postMessage = function(data) {
        window.ReactNativeWebView.postMessage(data);
    };
})()`;
                setBloomPlayerJS(
                    jsFileContents +
                        postMessageWorkaroundJavascript +
                        "\ntrue; // note: this is required, or you'll sometimes get silent failures"
                );
            };
            loadBloomPlayerAssetAsync();

            if (Platform.OS === "android") {
                // Copy HTM from dist to cache
                // (Special workaround for react-native-webview bug preventing loading the dist version directly)
                const loadBloomPlayerHtmAsync = async () => {
                    const bloomPlayerHtmAsset = Asset.fromModule(
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        require("../../../dist/bloom-player/bloomplayer.htm")
                    );

                    await ensureBPFolderAsync();
                    await copyAssetAsync({
                        asset: bloomPlayerHtmAsset,
                        to: ANDROID_BLOOM_PLAYER_PATH,
                    });
                    setBloomPlayerHtmReady(true);
                };

                loadBloomPlayerHtmAsync();

                // Copy audio assets to same folder as bloomplayer.htm
                // TODO: Verify that iOS doesn't need this
                const audioAssets = [
                    Asset.fromModule(
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        require("../../../dist/bloom-player/right_answer-913c37e88e2939122d763361833efd24.mp3")
                    ),
                    Asset.fromModule(
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        require("../../../dist/bloom-player/wrong_answer-f96cfc1e0cc2cea2dd523d521d4c8738.mp3")
                    ),
                ];
                audioAssets.forEach(async (asset) => {
                    const destPath = `${ANDROID_BLOOM_PLAYER_FOLDER}/${asset.name}.${asset.type}`;

                    await ensureBPFolderAsync();
                    copyAssetAsync({
                        asset,
                        to: destPath,
                    });
                });
            }
        },
        // don't bother setting the uri or loading the jsAsset unless we've unzipped something.
        [bookHtmPath]
    );

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

    const isLoading = uri === "" || !bloomPlayerHtmReady || !bloomPlayerJS;

    if (!isLoading && bloomPlayerJS.length <= 0) {
        // I think Webview only injects the Javascript on the first time,
        // so we do want the Javascript to be ready before we make the Webview for the first time.
        console.warn("Starting Webview, but javascript code is not ready yet!");
    }

    return (
        <>
            {error ? (
                <Text>Error: {error}</Text>
            ) : (
                <>
                    {isLoading ? (
                        <ActivityIndicator color={Colors.bloomRed} />
                    ) : (
                        <WebView
                            style={styles.webViewStyles}
                            source={{ uri }}
                            injectedJavaScript={bloomPlayerJS}
                            scalesPageToFit={true}
                            automaticallyAdjustContentInsets={false}
                            javaScriptEnabled={true}
                            allowFileAccess={true} // Needed for Android to access the bloomplayer.htm in cache dir
                            allowFileAccessFromFileURLs={true} // Needed to load the book's HTM. allowUniversalAccessFromFileURLs is fine too.
                            originWhitelist={["*"]} // Some widgets need this to load their content
                            onMessage={onMessageReceived}
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
    return FileSystem.makeDirectoryAsync(ANDROID_BLOOM_PLAYER_FOLDER, {
        intermediates: true,
    });
}
export default BookReader;
