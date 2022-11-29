import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { FunctionComponent } from "react";
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native";
import { ReaderScreenProps } from "../navigationTypes";
import BookReader from "../components/BookReader/BookReader";

export const ReaderScreen: FunctionComponent<ReaderScreenProps> = ({
    navigation,
    route,
}: ReaderScreenProps) => {
    // Besides height and width, the object also contains scale and fontsize,
    // should we ever have need of them.
    const windowSize = useWindowDimensions();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            height: windowSize.height,
            width: windowSize.width,
            backgroundColor: "#2e2e2e",
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden={true} />
            <BookReader
                bloomPubPath={route.params.bookUrl}
                navigation={navigation}
            />
        </SafeAreaView>
    );
};

export default ReaderScreen;
