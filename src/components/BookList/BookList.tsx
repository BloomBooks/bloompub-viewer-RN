import { useHeaderHeight } from "@react-navigation/elements";
import Constants from "expo-constants";
import * as React from "react";
import {
    FlatList,
    Platform,
    SafeAreaView,
    TouchableOpacity,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { Item } from "react-navigation-header-buttons";
import { BloomContext } from "../../BloomContext";
import { Spacing } from "../../constants/Spacing";
import I18n from "../../i18n/i18n";
import {
    deleteBookOrShelf,
    initRootCollection,
    syncCollectionAndFetch,
} from "../../models/BookCollection";
import {
    Book,
    BookOrShelf,
    displayName,
    isShelf,
    Shelf,
    sortedListForShelf,
} from "../../models/BookOrShelf";
import * as ImportBookModule from "../../native_modules/ImportBookModule";
import { BookListScreenProps } from "../../navigationTypes";
import { BRHeaderButtons } from "../shared/BRHeaderButtons";
import { HeaderImage } from "./BookListHeader";
import BookListItem from "./BookListItem";
import ShelfListItem from "./ShelfListItem";

export const BookList: React.FunctionComponent<BookListScreenProps> = ({
    navigation,
    route,
}) => {
    const [selectedItem, setSelectedItem] = React.useState<
        BookOrShelf | undefined
    >(undefined);
    const [fullyLoaded, setFullyLoaded] = React.useState(false); // Review: in BloomReader-RN, it was implicitly boolean | undefined. Check that we don't actually need undefined.

    const theme = useTheme();
    const headerImageHeight =
        useHeaderHeight() - Constants.statusBarHeight - Spacing.Small;

    const bloomContext = React.useContext(BloomContext);

    const selectItem = (item: BookOrShelf) => {
        setSelectedItem(item);
    };

    const clearSelectedItem = () => {
        setSelectedItem(undefined);
    };

    React.useEffect(() => {
        const syncCollectionAsync = async () => {
            if (route.params.shelf === undefined) {
                // This is the root BookList
                // // Sync collection with actual contents of public book folders
                // const updatedCollection = await syncCollectionAndFetch();
                // bloomContext.setBookCollection(updatedCollection);
                // // Having a file shared with us results in a new instance of our app,
                // // so we can check for imports in componentDidMount()
                // await checkForBooksToImport();

                await initRootCollection();
                // BRAnalytics.screenView("Main");
            } else {
                // BRAnalytics.screenView("Shelf", displayName(shelf));
            }
            setFullyLoaded(true);
        };
        syncCollectionAsync();
    }, [route.params.shelf]);

    const checkForBooksToImport = async () => {
        const updatedCollection =
            await ImportBookModule.checkForBooksToImport();
        if (updatedCollection) {
            bloomContext.setBookCollection(updatedCollection);
            if (updatedCollection.newBook) openBook(updatedCollection.newBook);
        }
    };

    const itemTouch = (item: BookOrShelf) => {
        if (selectedItem) clearSelectedItem();
        else isShelf(item) ? openShelf(item) : openBook(item);
    };

    const openBook = (book: Book) =>
        navigation.navigate("BookReader", {
            bookUrl: book.filepath,
        });

    const openShelf = (shelf: Shelf) => {
        navigation.push("BookList", {
            shelf: shelf,
        });
    };

    React.useEffect(() => {
        if (selectedItem) {
            const deleteSelectedItem = async () => {
                if (!selectedItem) {
                    console.warn(
                        "deletedSelectedItem called, but selectedItem is undefined."
                    );
                    return;
                }
                const newCollection = await deleteBookOrShelf(selectedItem);
                bloomContext.setBookCollection(newCollection);
                clearSelectedItem();
            };

            navigation.setOptions({
                //headerTitle: displayName(selectedItem), //BloomReader-RN does this, but BloomReader Android just leaves it blank.
                headerTitle: "",
                headerLeft: () => (
                    <BRHeaderButtons>
                        <Item
                            title="back"
                            iconName={
                                Platform.OS === "ios"
                                    ? "ios-arrow-back"
                                    : "md-arrow-back"
                            }
                            onPress={clearSelectedItem}
                        />
                    </BRHeaderButtons>
                ),
                headerRight: () => (
                    <BRHeaderButtons>
                        {/* Sharing not supported in this version */}
                        {/* <Item
                            title="share"
                            iconName="md-share"
                            onPress={shareSelectedItem)}
                        /> */}
                        <Item
                            title="trash"
                            iconName={
                                Platform.OS === "ios" ? "ios-trash" : "md-trash"
                            }
                            onPress={deleteSelectedItem}
                        />
                    </BRHeaderButtons>
                ),
            });
        } else {
            navigation.setOptions({
                headerTitle: route.params.shelf
                    ? displayName(route.params.shelf)
                    : () => <HeaderImage height={headerImageHeight} />,
                headerLeft: route.params.shelf
                    ? undefined
                    : () => (
                          // Let ReactNavigation supply the default back arrow
                          <BRHeaderButtons>
                              <Item
                                  title="drawer"
                                  iconName="md-menu"
                                  // onPress={navigation.toggleDrawer}
                                  onPress={() => {
                                      alert("Pretending to open drawer");
                                  }}
                                  accessibilityLabel={I18n.t("Main Menu")}
                              />
                          </BRHeaderButtons>
                      ),
                headerRight: undefined,
            });
        }
    }, [
        route.params.shelf,
        navigation,
        selectedItem,
        headerImageHeight,
        bloomContext,
    ]);

    const list = sortedListForShelf(
        route.params.shelf,
        bloomContext.bookCollection
    );

    console.log("Rendering BookList " + Date.now());
    return (
        <SafeAreaView
            style={{
                flex: 1,
                paddingVertical: Spacing.Small,
                paddingHorizontal: Spacing.ExtraSmall,
            }}
        >
            {/* <StatusBar backgroundColor={ThemeColors.darkRed} /> */}
            {/* {!this.state.fullyLoaded && <ProgressSpinner />} */}
            <FlatList
                // extraData={this.state}
                style={{ paddingHorizontal: Spacing.Small }}
                data={list}
                keyExtractor={(item) =>
                    isShelf(item) ? item.id : item.filepath
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => itemTouch(item)}
                        onLongPress={() => selectItem(item)}
                    >
                        {isShelf(item) ? (
                            <ShelfListItem
                                shelf={item}
                                isSelected={selectedItem == item}
                            />
                        ) : (
                            <BookListItem
                                book={item}
                                isSelected={selectedItem == item}
                            />
                        )}
                    </TouchableOpacity>
                )}
            />
            <Button
                mode="outlined"
                onPress={() => {
                    console.log("switching to Bloom Library screen");
                    navigation.navigate("Library");
                }}
                theme={{
                    ...theme,
                    colors: {
                        ...theme.colors,
                        outline: theme.colors.primary,
                    },
                    roundness: 1,
                }}
                style={{
                    paddingHorizontal: Spacing.ExtraSmall,
                }}
                // TODO: Add a search icon
            >
                Get more books from our library
            </Button>
            {/* TODO: Figure out if we need this BackHandler stuff. */}
            {/* Custom handler for Android back button */}
            {/* <AndroidBackHandler
                onBackPress={() => {
                    if (this.state.selectedItem) {
                        this.clearSelectedItem();
                        return true;
                    }
                    return false; // Default back button behavior
                }}
            /> */}
            {/* TODO: Implement me */}
            {/* <DrawerUnlocker
                setDrawerLockMode={this.props.screenProps.setDrawerLockMode}
            /> */}
        </SafeAreaView>
    );
};
