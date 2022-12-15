import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Shelf } from "./models/BookOrShelf";

// export type RootStackParamList = {
//     Home: undefined;
//     Read: { bookUrl: string };
//     Library: undefined;
// };
export type RootStackParamList = {
    BookList: { shelf: Shelf | undefined }; // TODO: This shouldn't take a Shelf. It should take a ShelfID. But how do we get the shelf from a shelf ID?
    BookReader: { bookUrl: string };
    Library: undefined;
    Home: undefined; // TODO: Deprecate me
};

export type BookListScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "BookList",
    "PUBViewer"
>;

export type ReaderScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "BookReader",
    "PUBViewer"
>;
export type HomeScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "Home",
    "PUBViewer"
>;
export type LibraryScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "Library",
    "PUBViewer"
>;
