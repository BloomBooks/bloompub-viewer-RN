import * as React from "react";
import { FunctionComponent, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ReaderScreenProps } from '../navigationTypes';
import BookReader from "../BookReader";

export const ReaderScreen: FunctionComponent<ReaderScreenProps> = ({ route, navigation }: ReaderScreenProps) => {
    console.log('in ReaderScreen');
    const [bookUrl, setBookUrl] = useState(route.params?.bookUrl);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Here's some text, just to get started.</Text>
            <Text style={styles.text}>Book URL is: {bookUrl}</Text>
            {/* <BookReader /> */}
        </View>
    )
}

const bloomRed: string = "#d65649";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    text: {
        color: bloomRed,
    }
});

export default ReaderScreen;
