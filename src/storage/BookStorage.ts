import * as FileSystem from "expo-file-system";
// import { unzip } from "react-native-zip-archive";

const OPEN_BOOK_DIR = FileSystem.cacheDirectory + "/openBook";

export async function openBookForReading(
    bookFilePath: string
): Promise<string> {
    console.log("OpenBookDir: " + OPEN_BOOK_DIR);
    await safeUnlink(OPEN_BOOK_DIR);

    // TODO: Problem! Expo doesn't work with react-native-zip-archive out of the box
    return OPEN_BOOK_DIR;
    // return await unzip(bookFilePath, OPEN_BOOK_DIR);
}

/**
 * Deletes a directory or file
 * @remarks Based on rnfsSafeUnlink in BloomReader-RN
 */
export async function safeUnlink(path: string): Promise<void> {
    try {
        await FileSystem.deleteAsync(path, {
            idempotent: true,
        });

        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
            throw new Error(`Tried to delete ${path}, but it's still there!`);
        }
    } catch (err) {
        console.error({
            logMessage: `[rnfsSafeUnlink] Error deleting file: ${path}\n${JSON.stringify(
                err
            )}`,
        });
    }
}
