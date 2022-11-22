import React from "react";
import { FunctionComponent } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableHighlight,
} from "react-native";
import { HomeScreenProps } from "../navigationTypes";

export const StartScreen: FunctionComponent<HomeScreenProps> = ({
    navigation,
}: HomeScreenProps) => {
    console.log("in Home screen");
    // test URL
    const defaultUrl =
        "https%3A%2F%2Fs3.amazonaws.com%2Fbloomharvest-sandbox%2Fcolin_suggett%2540sil.org%252f885ba15f-97a7-4c83-ba3c-ae263607d9e6%2Fbloomdigital%252findex.htm";
    const goRead = () => {
        navigation.navigate("Read", { bookUrl: defaultUrl });
        console.log("switching to Read screen");
    };

    return (
        <View style={styles.startScreen}>
            <Image
                style={styles.logo}
                source={require("../../assets/wordmark.png")}
            />
            <TouchableHighlight onPress={goRead} style={styles.highlight}>
                <View style={styles.buttonContainer}>
                    <Image
                        style={styles.button}
                        source={require("../../assets/Open.png")}
                    />
                    <Text style={styles.text}>
                        Choose BloomPUB book on this device
                    </Text>
                </View>
            </TouchableHighlight>
            <TouchableHighlight onPress={goRead} style={styles.highlight}>
                <View style={styles.buttonContainer}>
                    <Image
                        style={styles.button}
                        source={require("../../assets/Search.png")}
                    />
                    <Text style={styles.text}>
                        Get BloomPUB books on BloomLibrary.org
                    </Text>
                </View>
            </TouchableHighlight>
        </View>
    );
};

const bloomRed: string = "#d65649";

const styles = StyleSheet.create({
    startScreen: {
        flex: 1,
        justifyContent: "flex-start",
        backgroundColor: "#fff",
        alignItems: "center",
    },
    logo: {
        width: 255,
        height: 100,
        resizeMode: "contain",
    },
    button: {
        width: 30,
        height: 30,
        resizeMode: "contain",
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
    },
});

export default StartScreen;
