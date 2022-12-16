import "react-native-gesture-handler"; // Must the first line! At least, according to its documentation
import React from "react";
import { useWindowDimensions } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootDrawerParamList, MainStackParamList } from "./src/navigationTypes";
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
import { DrawerMenu } from "./src/components/DrawerMenu/DrawerMenu";
import { BloomContext } from "./src/BloomContext";
import startupTasks from "./src/util/startupTasks";

const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainStackComponent = () => {
    return (
        <MainStack.Navigator initialRouteName="BookList" id="MainStack">
            <MainStack.Screen
                name="BookList"
                component={BookList}
                initialParams={{
                    shelf: undefined,
                }}
                options={{
                    headerStyle: {
                        backgroundColor: bloomDarkTheme.colors.background,
                    },
                }}
            />
            <MainStack.Screen
                name="BookReader"
                component={ReaderScreen}
                options={{ headerShown: false }}
            />
            <MainStack.Screen name="Library" component={LibraryScreen} />
            {/* The old bloompub-viewer Home screen. It can be deleted one day */}
            {/* <RootStack.Screen
        name="Home"
        component={StartScreen}
    /> */}
        </MainStack.Navigator>
    );
};

// NOTE: BloomReader-RN uses React Navigation v4. Link to old documentation: https://reactnavigation.org/docs/4.x/drawer-navigator/#api
const Drawer = createDrawerNavigator<RootDrawerParamList>();

const App = () => {
    const [drawerLockMode, setDrawerLockMode] = React.useState<
        "unlocked" | "locked-closed"
    >("unlocked");
    const [bookCollection, setBookCollection] = React.useState<BookCollection>(
        emptyBookCollection()
    );
    const { width: windowWidth } = useWindowDimensions();

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
                        <Drawer.Navigator
                            drawerContent={DrawerMenu}
                            screenOptions={{
                                drawerStyle: { width: windowWidth - 16 },
                                headerShown: false, // usually preferable to hide the parent's header and use the child's instead
                            }}
                        >
                            <Drawer.Screen
                                name="Main"
                                component={MainStackComponent}
                            ></Drawer.Screen>
                        </Drawer.Navigator>
                    </NavigationContainer>
                </BloomContext.Provider>
            </PaperProvider>
        </RootSiblingParent>
    );
};
export default App;
