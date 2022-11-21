import * as React from "react";
import { FunctionComponent } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ReaderScreenProps } from '../navigationTypes';
import BookReader from "../BookReader";

export const ReaderScreen: FunctionComponent<ReaderScreenProps> = ({ route, navigation }: ReaderScreenProps) => {
    return (
        <SafeAreaView style={styles.container}>
            <BookReader bookUrl={route.params.bookUrl} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    }
});

export default ReaderScreen;
