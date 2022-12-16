import * as Application from "expo-application";
import React, { FunctionComponent } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Dimensions,
    Image,
} from "react-native";
import { Text } from "react-native-paper";
import I18n from "../../i18n/i18n";
import DrawerMenuItem from "./DrawerMenuItem";
// import { DrawerItemsProps } from "react-navigation";
// import { Notes } from "../NotesScreen/NotesScreen";
// import * as Share from "../../util/Share";
import * as ErrorLog from "../../util/ErrorLog";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { pickBloomPubAsync } from "../../util/FilePicker";

export const DrawerMenu: FunctionComponent<DrawerContentComponentProps> = ({
    navigation,
}) => {
    // Have the drawer cover most of the screen
    const drawerWidth = Dimensions.get("window").width - 16;
    // We only want the logo to be about 2/3 of that width
    const imageWidth = (drawerWidth / 3) * 2;
    // Image ratio is 600x156 pixels; adjust height to match width of drawer
    const imageHeight = (imageWidth / 600) * 156;

    return (
        <SafeAreaView>
            <ScrollView>
                <View style={{ backgroundColor: "black", padding: 10 }}>
                    <Image
                        source={require("../../../assets/bloom-reader-against-dark.png")}
                        style={{
                            width: imageWidth,
                            height: imageHeight,
                        }}
                    />
                    <Text style={{ color: "white" }}>
                        {Application.nativeApplicationVersion}
                    </Text>
                </View>
                {/* Sharing is not supported in this version. */}
                {/* <DrawerMenuItem
                    label={I18n.t("Receive books from computer")}
                    iconName="md-wifi"
                    onPress={() => {
                        this.props.navigation.navigate("ReceiveFromWifiScreen");
                    }}
                /> */}
                {/* <DrawerMenuItem
          label={I18n.t("Share Books")}
          iconName="md-share"
          onPress={() => {
            Share.shareAll();
            this.props.navigation.closeDrawer();
          }}
        />
        <DrawerMenuItem
          label={I18n.t("Share Bloom Reader app")}
          iconName="md-share"
          onPress={() => {
            Share.shareApp();
            this.props.navigation.closeDrawer();
          }}
        /> */}
                <DrawerMenuItem
                    label={I18n.t("Open BloomPUB file")}
                    // BR Android uses Bookshelf.png, but I wonder what about Open.png from bloompub-viewer
                    // iconSource={require("../../../assets/Open.png")}
                    iconSource={require("../../../assets/bookshelf.png")}
                    onPress={async () => {
                        const bookUrl = await pickBloomPubAsync();
                        if (!bookUrl) {
                            return;
                        }

                        navigation.navigate("Main", {
                            screen: "BookReader",
                            params: {
                                bookUrl,
                            },
                        });
                    }}
                />
                <View
                    style={{ borderBottomWidth: 1, borderBottomColor: "gray" }}
                />
                <DrawerMenuItem
                    label={I18n.t("Release Notes")}
                    onPress={
                        () =>
                            alert(
                                "Pretending to open release notes. (Not implemented)"
                            )
                        // this.props.navigation.navigate("NotesScreen", {
                        //   notes: Notes.ReleaseNotes
                        // })
                    }
                />
                <DrawerMenuItem
                    label={I18n.t("About Bloom Reader")}
                    onPress={
                        () =>
                            alert(
                                "Pretending to open About Bloom Reader. (Not implemented)"
                            )
                        // this.props.navigation.navigate("NotesScreen", {
                        //     notes: Notes.AboutBloomReader,
                        // })
                    }
                />
                <DrawerMenuItem
                    label={I18n.t("About Bloom")}
                    onPress={
                        () =>
                            alert(
                                "Pretending to open About Bloom. (Not implemented)"
                            )
                        // this.props.navigation.navigate("NotesScreen", {
                        //     notes: Notes.AboutBloom,
                        // })
                    }
                />
                <DrawerMenuItem
                    label={I18n.t("About SIL")}
                    onPress={
                        () =>
                            alert(
                                "Pretending to open About SIL. (Not implemented)"
                            )
                        // this.props.navigation.navigate("NotesScreen", {
                        //     notes: Notes.AboutSIL,
                        // })
                    }
                />
                {/* <DrawerMenuItem
          label={I18n.t("Email Error Log")}
          onPress={() => {
            ErrorLog.emailLog();
            this.props.navigation.closeDrawer();
          }}
        /> */}
            </ScrollView>
        </SafeAreaView>
    );
};
