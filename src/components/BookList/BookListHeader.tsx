import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import React from "react";
import { Image, View } from "react-native";
import { Spacing } from "../../constants/Spacing";

// export const BookListHeader = ({
//     options,
//     navigation,
// }: NativeStackHeaderProps) => {
//     return (
//         <View style={[options.headerStyle, { height: 60 }]}>
//             <HeaderImage />
//         </View>
//     );
// };

export const HeaderImage = () => {
    // TODO: Actually, compared to the Android app, the default header height is too short
    //
    // BloomReader (Android):
    //  The image is 350 device-independent pixels wide.
    //
    // BloomReader-RN:
    // // Have the drawer cover most of the screen
    // const drawerWidth = windowWidth - 16;
    // // We only want the logo to be about 2/3 of that width
    // const imageWidth = (drawerWidth / 3) * 2;
    // // Image ratio is 600x156 pixels; adjust height to match width of drawer
    // const imageHeight = (imageWidth / 600) * 156;

    const imageHeight =
        useHeaderHeight() - Constants.statusBarHeight - Spacing.Small;
    // Image ratio is 600x156 pixels; adjust height to match width of drawer
    const imageWidth = (imageHeight * 600) / 156;

    return (
        <Image
            source={require("../../../assets/bloom-reader-against-dark.png")}
            style={{
                width: imageWidth,
                height: imageHeight,
            }}
        />
    );
};
