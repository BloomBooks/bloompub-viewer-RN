import React from "react";
import { StyleSheet, Text, View, Image, TouchableHighlight } from 'react-native';

export const StartScreen = () => {
    const goRead = () => {}

    return (
        <View style={styles.startScreen}>
            <Image
                style={styles.logo}
                source={require('../assets/wordmark.png')}
            />
            <TouchableHighlight
                onPress={goRead}
                style={styles.highlight}
            >
                <View style={styles.buttonContainer}>
                    <Image
                        style={styles.button}
                        source={require('../assets/Open.png')}
                    />
                    <Text style={styles.text}>Choose BloomPUB book on this device</Text>
                </View>
            </TouchableHighlight>
            <TouchableHighlight
                onPress={goRead}
                style={styles.highlight}
            >
                <View style={styles.buttonContainer}>
                    <Image
                        style={styles.button}
                        source={require('../assets/Search.png')}
                    />
                    <Text style={styles.text}>Get BloomPUB books on BloomLibrary.org</Text>
                </View>
            </TouchableHighlight>
        </View>
    );
};

const bloomRed: string = "#d65649";

const styles = StyleSheet.create({
    startScreen: {
        flex: 1,
        alignContent: "center",
        justifyContent: "flex-start",
        marginTop: 60,
    },
    logo: {
        width: 255,
        height: 100,
        resizeMode: 'contain',
    },
    button: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    highlight: {
        width: 275,
        maxHeight: 40,
        flexDirection: "row",
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: "row",
    },
    text: {
        marginLeft: 10,
        marginTop: 5,
        color: bloomRed,
    }
});

export default StartScreen;
