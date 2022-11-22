import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as React from "react";
import { FunctionComponent } from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

interface BookReaderProps {
    bookUrl: string;
}

export const BookReader: FunctionComponent<BookReaderProps> = (props) => {
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

    const uri = `${baseUri}&url=${props.bookUrl}&centerVertically=true&independent=false&host=bloompubviewer`;

    // TODO: Are any of these params desired?
    // &useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false

    const [bloomPlayerJS, setBloomPlayerJS] = React.useState("");

    React.useEffect(() => {
        if (Platform.OS === "android") {
            // Since Android isn't attempting local in this way, no need for this.
            return;
        }

        const asyncHelper = async () => {
            // Since I could't get the script referenced in the HTM file to run,
            // I just read it out and inject it via props instead to start its execution.
            //
            // ENHANCE: The old script tag is still in the HTML and will print out an error message
            // in the console. A minor annoyance.

            const bloomPlayerJSAsset = Asset.fromModule(
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require("../dist/bloom-player/bloomPlayer.jsAsset")
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
        asyncHelper();
    }, []);

    return (
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
    );
};

const styles = StyleSheet.create({
    webViewStyles: {
        flex: 1,
    },
});

export default BookReader;
