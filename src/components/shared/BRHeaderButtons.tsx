import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
    HeaderButtons,
    HeaderButton,
    HeaderButtonsProps,
} from "react-navigation-header-buttons";

const BRHeaderButton = (props: { title: string }) => (
    <HeaderButton
        IconComponent={Ionicons}
        iconSize={23}
        color="white"
        {...props}
    />
);

export const BRHeaderButtons: React.FunctionComponent<HeaderButtonsProps> = (
    props
) => <HeaderButtons HeaderButtonComponent={BRHeaderButton} {...props} />;

// export const Item = HeaderButtons.Item;
