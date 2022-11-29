import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";
import { safeUnlink } from "../util/FileUtil";

export const OPEN_BOOK_DIR = FileSystem.cacheDirectory + "openBook";

export async function openBookForReading(
    bookFilePath: string
): Promise<string> {
    //console.log("... in openBookForReading");
    await safeUnlink(OPEN_BOOK_DIR);

    //console.log(`starting unzip from ${bookFilePath}\nto ${OPEN_BOOK_DIR}`);
    return unzip(bookFilePath, OPEN_BOOK_DIR);
}
