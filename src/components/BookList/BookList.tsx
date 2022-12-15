import * as React from "react";
import { FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { BloomContext } from "../../BloomContext";
import { Spacing } from "../../constants/Spacing";
import {
    initRootCollection,
    syncCollectionAndFetch,
} from "../../models/BookCollection";
import {
    Book,
    BookOrShelf,
    isShelf,
    Shelf,
    sortedListForShelf,
} from "../../models/BookOrShelf";
import * as ImportBookModule from "../../native_modules/ImportBookModule";
import { BookListScreenProps } from "../../navigationTypes";
import BookListItem from "./BookListItem";
import ShelfListItem from "./ShelfListItem";

export const BookList: React.FunctionComponent<BookListScreenProps> = ({
    navigation,
    route,
}) => {
    // TODO: Look at BloomReader-RN's implementation and pull a lot more things out of it.
    const [selectedItem, setSelectedItem] = React.useState<
        BookOrShelf | undefined
    >(undefined);
    const [fullyLoaded, setFullyLoaded] = React.useState(false); // Review: in BloomReader-RN, it was implicitly boolean | undefined. Check that we don't actually need undefined.

    const theme = useTheme();

    const bloomContext = React.useContext(BloomContext);

    const getShelf = React.useCallback((): Shelf | undefined => {
        return route.params.shelf;
    }, [route.params.shelf]);

    const selectItem = (item: BookOrShelf) => {
        setSelectedItem(item);
        // TODO: Is this necessary?
        //this.props.navigation.setParams({ selectedItem: item });
    };

    const clearSelectedItem = () => {
        setSelectedItem(undefined);

        // TODO: Implement equivalent of this:
        // this.props.navigation.setParams({ selectedItem: undefined });
    };
    React.useEffect(() => {
        const syncCollectionAsync = async () => {
            const shelf = getShelf();
            if (shelf === undefined) {
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
    }, [getShelf]);

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
            //book: book,
            bookUrl: book.filepath,
        });

    const openShelf = (shelf: Shelf) => {
        navigation.push("BookList", {
            shelf: shelf,
        });
    };

    // TODO: Navigation options

    const list = sortedListForShelf(getShelf(), bloomContext.bookCollection);

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
