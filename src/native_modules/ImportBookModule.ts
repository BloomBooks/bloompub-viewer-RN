// import { NativeModules } from "react-native";
// import RNFS from "react-native-fs";
import {
    BookCollectionWithNewBook,
    //       importBookDirToCollection,
    //       importBookToCollection
} from "../models/BookCollection";

// const ImportBooksModule = NativeModules.ImportBooksModule;

export async function checkForBooksToImport(): Promise<
    BookCollectionWithNewBook | undefined
> {
    return undefined;

    // TODO: Implement me
    //   const importPath = await ImportBooksModule.checkForBooksToImport();
    //   if (importPath) {
    //     const statResult = await RNFS.stat(importPath);
    //     if (statResult.isDirectory())
    //       return await importBookDirToCollection(importPath);
    //     else {
    //       return await importBookToCollection(importPath, "FileIntent");
    //     }
    //   }
}
