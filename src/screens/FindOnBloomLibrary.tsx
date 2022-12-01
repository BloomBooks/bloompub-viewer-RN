import * as React from "react";
import { FunctionComponent } from "react";
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native";
//import * as FileSystem from "expo-file-system";
import { LibraryScreenProps } from "../navigationTypes";
import WebView from "react-native-webview";

export const LibraryScreen: FunctionComponent<LibraryScreenProps> = () => {
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

    const libraryUrl = "https://bloomlibrary.org";

    alert(
        "After downloading a book for offline reading, go back to the Home screen."
    );

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                source={{
                    uri: libraryUrl,
                }}
                scalesPageToFit={true}
                automaticallyAdjustContentInsets={false}
            />
        </SafeAreaView>
    );
};

export default LibraryScreen;
