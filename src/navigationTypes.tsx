import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Shelf } from "./models/BookOrShelf";

export type RootDrawerParamList = {
    Main: MainStackParamList;
};

export type MainStackParamList = {
    BookList: { shelf: Shelf | undefined }; // TODO: This shouldn't take a Shelf. It should take a ShelfID. But how do we get the shelf from a shelf ID?
    BookReader: { bookUrl: string };
    Library: undefined;
};

export type BookListScreenProps = NativeStackScreenProps<
    MainStackParamList,
    "BookList",
    "MainStack"
>;

export type ReaderScreenProps = NativeStackScreenProps<
    MainStackParamList,
    "BookReader",
    "MainStack"
>;
export type LibraryScreenProps = NativeStackScreenProps<
    MainStackParamList,
    "Library",
    "MainStack"
>;
