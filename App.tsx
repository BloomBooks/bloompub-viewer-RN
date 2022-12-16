import "react-native-gesture-handler"; // Must the first line! At least, according to its documentation
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/navigationTypes";
import StartScreen from "./src/screens/StartScreen";
import ReaderScreen from "./src/screens/ReaderScreen";
import LibraryScreen from "./src/screens/FindOnBloomLibrary";
import { bloomDarkTheme, bloomLightTheme } from "./src/constants/Theme";
import EStyleSheet from "react-native-extended-stylesheet";
import {
    BookCollection,
    emptyBookCollection,
    getBookCollection,
} from "./src/models/BookCollection";
import { BookList } from "./src/components/BookList/BookList";
import { BloomContext } from "./src/BloomContext";
import startupTasks from "./src/util/startupTasks";
import { HeaderImage } from "./src/components/BookList/BookListHeader";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
    const [drawerLockMode, setDrawerLockMode] = React.useState<
        "unlocked" | "locked-closed"
    >("unlocked");
    const [bookCollection, setBookCollection] = React.useState<BookCollection>(
        emptyBookCollection()
    );

    EStyleSheet.build();

    React.useEffect(() => {
        const onComponentMount = async () => {
            await startupTasks();

            const myBookCollection = await getBookCollection();
            setBookCollection(myBookCollection);

            // If you have a custom splash screen, you can hide it now
        };

        onComponentMount();
    }, []);

    return (
        <RootSiblingParent>
            <PaperProvider theme={bloomLightTheme}>
                <BloomContext.Provider
                    value={{
                        bookCollection,
                        setBookCollection: (
                            newBookCollection: BookCollection
                        ) => {
                            console.log(
                                "Setting book collection: " +
                                    JSON.stringify(newBookCollection)
                            );
                            setBookCollection(newBookCollection);
                        },
                        drawerLockMode,
                        setDrawerLockMode: (
                            lockMode: "unlocked" | "locked-closed"
                        ) => setDrawerLockMode(lockMode),
                    }}
                >
                    <NavigationContainer>
                        <RootStack.Navigator
                            initialRouteName="BookList"
                            id="PUBViewer"
                        >
                            <RootStack.Screen
                                name="BookList"
                                component={BookList}
                                initialParams={{
                                    shelf: undefined,
                                }}
                                options={{
                                    headerStyle: {
                                        backgroundColor:
                                            bloomDarkTheme.colors.background,
                                    },
                                }}
                            />
                            <RootStack.Screen
                                name="BookReader"
                                component={ReaderScreen}
                                options={{ headerShown: false }}
                            />
                            <RootStack.Screen
                                name="Library"
                                component={LibraryScreen}
                            />
                            {/* The old bloompub-viewer Home screen. It can be deleted one day */}
                            {/* <RootStack.Screen
                                name="Home"
                                component={StartScreen}
                            /> */}
                        </RootStack.Navigator>
                    </NavigationContainer>
                </BloomContext.Provider>
            </PaperProvider>
        </RootSiblingParent>
    );
};
export default App;
