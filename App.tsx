import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/navigationTypes";
import StartScreen from "./src/screens/StartScreen";
import ReaderScreen from "./src/screens/ReaderScreen";
import LibraryScreen from "./src/screens/FindOnBloomLibrary";
import { bloomLightTheme } from "./src/constants/Theme";
import EStyleSheet from "react-native-extended-stylesheet";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
    EStyleSheet.build();

    return (
        <PaperProvider theme={bloomLightTheme}>
            <NavigationContainer>
                <RootStack.Navigator initialRouteName="Home" id="PUBViewer">
                    <RootStack.Screen name="Home" component={StartScreen} />
                    <RootStack.Screen
                        name="Read"
                        component={ReaderScreen}
                        options={{ headerShown: false }}
                    />
                    <RootStack.Screen
                        name="Library"
                        component={LibraryScreen}
                    />
                </RootStack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
};

export default App;
