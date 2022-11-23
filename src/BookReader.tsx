import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent, useEffect, useState } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { WebView } from "react-native-webview";
import { openBookForReading } from "./storage/BookStorage";

interface BookReaderProps {
    bloomPubPath: string;
}

export const BookReader: FunctionComponent<BookReaderProps> = (props) => {
    const [bloomPlayerJS, setBloomPlayerJS] = useState("");
    const [bookHtmPath, setBookHtmPath] = useState("");

    const [error, setError] = useState<string | null>(null);

    //console.log('in BookReader');
    // react-native-webview has a bug on Android where local URI sources print out the HTML as text instead of as HTML
    // (See https://github.com/react-native-webview/react-native-webview/issues/428 and https://github.com/react-native-webview/react-native-webview/issues/518)
    // For now, we'll just have Android reference the online version
    const baseUri =
        Platform.OS === "android"
            ? "https://bloomlibrary.org/bloom-player/bloomplayer.htm?"
            : Asset.fromModule(
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  require("../dist/bloom-player/bloomplayer.htm")
              ).uri;

    const uri = `${baseUri}&url=${bookHtmPath}&centerVertically=true&independent=false&host=bloompubviewer`;
    console.log("Read uri: " + uri);

    // TODO: Are any of these params desired?
    // &useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false

    useEffect(() => {
        const loadBloomPlayerAssetAsync = async () => {
            if (Platform.OS === "android") {
                // Since Android isn't attempting local in this way, no need for this.
                return;
            }

            // Since I could't get the script referenced in the HTM file to run,
            // I just read it out and inject it via props instead to start its execution.
            //
            // ENHANCE: The old script tag is still in the HTML and will print out an error message
            // in the console. A minor annoyance.

            const bloomPlayerJSAsset = Asset.fromModule(
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require("../dist/bloom-player/bloomPlayerMin.jsAsset")
            );
            await bloomPlayerJSAsset.downloadAsync();

            if (!bloomPlayerJSAsset.localUri) {
                return;
            }
            const jsFileContents = await FileSystem.readAsStringAsync(
                bloomPlayerJSAsset.localUri
            );
            setBloomPlayerJS(
                jsFileContents +
                    "\ntrue; // note: this is required, or you'll sometimes get silent failures"
            );
        };
        loadBloomPlayerAssetAsync();

        // Unzip .bloompub and get the path to the HTM file inside the .bloompub
        const openBookFromStorageAsync = async () => {
            const unzippedBookFolderPath = await openBookForReading(
                props.bloomPubPath
            );
            const directoryContents = await FileSystem.readDirectoryAsync(
                unzippedBookFolderPath
            );
            const htmFiles = directoryContents.filter((filename) =>
                filename.endsWith(".htm")
            );
            if (htmFiles.length >= 0) {
                console.log("bookHtmPath: " + bookHtmPath);
                setBookHtmPath(htmFiles[0]);
            } else {
                setError("Couldn't find any HTM files in book");
            }
        };
        openBookFromStorageAsync();
    }, []);

    return (
        <>
            {error ? (
                <Text>Error: {error}</Text>
            ) : (
                <WebView
                    style={styles.webViewStyles}
                    source={{
                        uri: uri,
                    }}
                    injectedJavaScript={bloomPlayerJS}
                    scalesPageToFit={true}
                    automaticallyAdjustContentInsets={false}
                    javaScriptEnabled={true}

                    // domStorageEnabled={true}
                    // allowUniversalAccessFromFileURLs={true}
                    // allowFileAccess={true}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    webViewStyles: {
        flex: 1,
    },
});

export default BookReader;
