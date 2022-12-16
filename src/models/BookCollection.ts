import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Locations } from "../constants/Locations";
import Toast from "react-native-root-toast";
import {
    Book,
    BookOrShelf,
    isShelf,
    recursiveListForShelf,
    Shelf,
    //   isShelf,
    //   recursiveListForShelf
} from "../models/BookOrShelf";
// //import { BookCollection } from "./BookCollection";
import I18n from "../i18n/i18n";
import * as BRAnalytics from "../util/BRAnalytics";
import * as BookStorage from "../storage/BookStorage";
import { ensureFolderAsync, isBookFile, isShelfFile } from "../util/FileUtil";

const KEY_PREFIX = "bloomreader.books.";
const BOOK_LIST_KEY = KEY_PREFIX + "books";
const SHELF_LIST_KEY = KEY_PREFIX + "shelves";
export const COLLECTION_FORMAT_VERSION = "4";

export interface BookCollection {
    books: Book[];
    shelves: Shelf[];
}

export interface BookCollectionWithNewBook extends BookCollection {
    newBook?: Book;
}

export function emptyBookCollection(): BookCollection {
    return {
        books: [],
        shelves: [],
    };
}

export async function syncCollectionAndFetch(): Promise<BookCollection> {
    let collection = await getBookCollection();
    collection = await syncPublicDirs(collection);
    writeCollection(collection);
    return collection;
}

export async function importBookToCollection(
    filepath: string,
    importMethod: BRAnalytics.AddedBooksMethod | null
): Promise<BookCollectionWithNewBook> {
    const collection = await getBookCollection();
    const book = await BookStorage.importBookFile(filepath);
    collection.books = collection.books.filter((b) => b.filepath != filepath); // Remove any existing copy
    collection.books.push(book);
    writeCollection(collection);

    if (importMethod) BRAnalytics.addedBooks(importMethod, [book.title]);
    return {
        ...collection,
        newBook: book,
    };
}

// export async function importBookDirToCollection(
//   srcDir: string
// ): Promise<BookCollection> {
//   const newItems = await BookStorage.importBooksDir(srcDir);
//   const collection = await getBookCollection();
//   const newCollection = addToCollection(collection, newItems);
//   writeCollection(newCollection);
//   BRAnalytics.addedBooks("FileIntent", newItems.books.map(b => b.title));
//   return newCollection;
// }

export async function updateBookListFormatIfNeeded(
    oldFormatVersion: string | null
): Promise<void> {
    console.log("oldFormatVersion: " + oldFormatVersion);
    if (oldFormatVersion == COLLECTION_FORMAT_VERSION) return;

    // This can take some time, let the user know what we're up to
    Toast.show(I18n.t("UpdatingBookCollectionFormat"), {
        duration: Toast.durations.SHORT,
    });

    const oldBookList = (await readList(BOOK_LIST_KEY)) as Book[];
    const newBookList: Book[] = [];
    for (let i = 0; i < oldBookList.length; ++i) {
        newBookList.push(
            await BookStorage.importBookFile(oldBookList[i].filepath)
        );
    }
    await writeList(BOOK_LIST_KEY, newBookList);
}

export async function deleteBookOrShelf(
    bookOrShelf: BookOrShelf
): Promise<BookCollection> {
    const collection = await getBookCollection();
    const toDelete = itemsToDelete(bookOrShelf, collection);
    BookStorage.deleteBooksAndShelves(toDelete);
    collection.books = collection.books.filter(
        (b) => !toDelete.some((item) => item.filepath == b.filepath)
    );
    collection.shelves = collection.shelves.filter(
        (s) => !toDelete.some((item) => isShelf(item) && item.id == s.id)
    );
    writeCollection(collection);
    return collection;
}

function addToCollection(
    collection: BookCollection,
    newItems: BookCollection
): BookCollection {
    const books = newItems.books.reduce(
        (combinedBooks, newBook) => [
            ...combinedBooks.filter((b) => b.filepath != newBook.filepath),
            newBook,
        ],
        collection.books
    );
    const shelves = newItems.shelves.reduce(
        (combinedShelves, newShelf) => [
            ...combinedShelves.filter((s) => s.id != newShelf.id),
            newShelf,
        ],
        collection.shelves
    );
    return { books, shelves };
}

function itemsToDelete(
    item: BookOrShelf,
    collection: BookCollection
): BookOrShelf[] {
    if (isShelf(item)) return recursiveListForShelf(item, collection);
    else return [item];
}

async function syncPublicDirs(
    collection: BookCollection
): Promise<BookCollection> {
    const files = await BookStorage.getPublicDirFiles();
    collection = removeMissingFilesFromCollection(collection, files);
    collection = await addNewOrUpdatedFilesToCollection(collection, files);
    return collection;
}

function removeMissingFilesFromCollection(
    collection: BookCollection,
    filePaths: string[]
): BookCollection {
    const privateDirs = BookStorage.privateStorageDirs();
    // Filter to keep item if from public dir OR if listed among current files
    const notRemovedFilter = (item: BookOrShelf) =>
        privateDirs.some((dirPath) => item.filepath.startsWith(dirPath)) ||
        filePaths.some((filePath) => filePath == item.filepath);

    return {
        books: collection.books.filter(notRemovedFilter),
        shelves: collection.shelves.filter(notRemovedFilter),
    };
}

async function addNewOrUpdatedFilesToCollection(
    collection: BookCollection,
    filePaths: string[]
): Promise<BookCollection> {
    console.log(
        "addNewOrUpdatedFilesToCollection: " + JSON.stringify(filePaths)
    );
    const booksAndShelves = (collection.books as BookOrShelf[]).concat(
        collection.shelves
    );
    const newItems = emptyBookCollection();
    for (let i = 0; i < filePaths.length; ++i) {
        const filePath = filePaths[i];
        const existing = booksAndShelves.find(
            (item) => item.filepath == filePath
        );
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (
            existing &&
            fileInfo.modificationTime &&
            fileInfo.modificationTime == existing.modifiedAt
        )
            continue;
        if (isBookFile(filePath))
            newItems.books.push(await BookStorage.importBookFile(filePath));
        else if (isShelfFile(filePath))
            newItems.shelves.push(await BookStorage.importShelfFile(filePath));
    }
    return addToCollection(collection, newItems);
}

export async function getBookCollection(): Promise<BookCollection> {
    return {
        books: (await readList(BOOK_LIST_KEY)) as Book[],
        shelves: (await readList(SHELF_LIST_KEY)) as Shelf[],
    };
}

async function writeCollection(collection: BookCollection): Promise<void> {
    console.log(
        "writeCollection called for collection: " + JSON.stringify(collection)
    );
    writeList(BOOK_LIST_KEY, collection.books);
    writeList(SHELF_LIST_KEY, collection.shelves);
}

async function readList(key: string): Promise<BookOrShelf[]> {
    const listJson = await AsyncStorage.getItem(key);
    return listJson ? JSON.parse(listJson) : [];
}

async function writeList(key: string, list: object[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(list));
}

// added in new repo
export async function initRootCollection() {
    await ensureFolderAsync(Locations.BooksFolder);
    const bookPaths = await FileSystem.readDirectoryAsync(
        Locations.BooksFolder
    );
    console.log("bookpaths: " + JSON.stringify(bookPaths));
}
