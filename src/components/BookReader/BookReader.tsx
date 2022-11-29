import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent, useEffect, useState } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { WebView } from "react-native-webview";
import { openBookForReading, OPEN_BOOK_DIR } from "../../storage/BookStorage";
import { copyAssetAsync, readAssetContentsAsync } from "../../util/FileUtil";

interface BookReaderProps {
    bloomPubPath: string;
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
            const uri = `${baseUri}&url=${encodedPath}&centerVertically=true&independent=false&host=bloompubviewer`;
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
                setBloomPlayerJS(
                    jsFileContents +
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

    // TODO: Are any of these params desired?
    // &useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false

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
                        <Text>Loading...</Text>
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
