import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";
import { Locations } from "../constants/Locations";
import {
    Book,
    BookFeatures,
    BookOrShelf,
    isShelf,
    Shelf,
} from "../models/BookOrShelf";
import { androidExternalStorageDirs } from "../native_modules/AndroidExternalStorageDirsModule";
import { castUnknownErrorToString, logError } from "../util/ErrorLog";
import {
    ensureFolderAsync,
    extension,
    nameFromPath,
    nameifyPath,
    readExternalBloomDir,
    safeUnlink,
} from "../util/FileUtil";
import { Path } from "../util/Path";

const PRIVATE_BOOKS_DIR = Locations.BooksFolder;
const THUMBS_DIR = Locations.ThumbsFolder;
export const OPEN_BOOK_DIR = FileSystem.cacheDirectory + "openBook";

interface ShelfFileContents {
    id: string;
    label: Array<{ [localeName: string]: string }>;
    color: string;
    tags: string[];
}

interface MetaData {
    bloomdVersion?: number;
    features?: BookFeatures[];
}

export async function createDirectories(): Promise<void> {
    return Promise.allSettled([
        ensureFolderAsync(PRIVATE_BOOKS_DIR),
        ensureFolderAsync(THUMBS_DIR),
    ]).then(() => undefined);
}

// Caches thumbnail and extracts metadata for BookCollection
export async function importBookFile(filepath: string): Promise<Book> {
    const tmpBookPath = await extractBookToTmp(filepath);
    const thumbPath = await saveThumbnail(tmpBookPath, filepath);
    const metaData = JSON.parse(
        await FileSystem.readAsStringAsync(`${tmpBookPath}/meta.json`)
    );
    const bookFeatures = await getFeaturesList(metaData, tmpBookPath);
    const fileInfo = await FileSystem.getInfoAsync(filepath);
    if (!fileInfo.exists) {
        throw new Error("File does not exist: " + filepath);
    }
    const modifiedAt = fileInfo.modificationTime;
    safeUnlink(tmpBookPath);
    const book = {
        filepath,
        title: metaData.title,
        allTitles: JSON.parse(metaData.allTitles.replace(/\n/g, " ")), // Remove newlines to avoid JSON parse error
        tags: metaData.tags,
        features: bookFeatures,
        thumbPath,
        modifiedAt,
        brandingProjectName: metaData.brandingProjectName,
        bloomdVersion: metaData.bloomdVersion ? metaData.bloomdVersion : 0,
    };
    return book;
}

// Parses shelf file and return Shelf based on contents
export async function importShelfFile(filepath: string): Promise<Shelf> {
    const fileContents = JSON.parse(
        await FileSystem.readAsStringAsync(filepath)
    ) as ShelfFileContents;
    const fileInfo = await FileSystem.getInfoAsync(filepath);
    if (!fileInfo.exists) {
        throw new Error("filepath does not exist: " + filepath);
    }
    const modifiedAt = fileInfo.modificationTime;
    return { ...fileContents, filepath, modifiedAt };
}

export function privateStorageDirs() {
    return [PRIVATE_BOOKS_DIR];
}

async function storageDirs() {
    let dirs = privateStorageDirs();
    dirs = dirs.concat(await androidExternalStorageDirs());
    try {
        const oldBloomDirPath = await readExternalBloomDir();
        dirs.push(oldBloomDirPath);
    } catch (err) {
        // Permission refused
        logError({ logMessage: castUnknownErrorToString(err) });
    }
    return dirs;
}

/**
 * Based off BloomReader-RN's corresponding version
 * @returns A promise of an array of strings. The strings represent the filepaths.
 */
export async function getPublicDirFiles(): Promise<string[]> {
    const dirPaths = (await storageDirs()).filter(
        (path) => path != PRIVATE_BOOKS_DIR
    );
    let files: string[] = [];
    for (let i = 0; i < dirPaths.length; ++i) {
        if ((await FileSystem.getInfoAsync(dirPaths[i])).exists)
            files = files.concat(
                await FileSystem.readDirectoryAsync(dirPaths[i])
            );
    }
    return files;
}

/**
 * From BloomReader-RN's corresponding version
 * @param bookFilePath: The path to the book. It must not contain "%" signs (e.g. percent-encoded URLs), or else react-native-zip-archive will throw an error.
 */
export async function openBookForReading(
    bookFilePath: string
): Promise<string> {
    //console.log("... in openBookForReading");
    await safeUnlink(OPEN_BOOK_DIR);

    //console.log(`starting unzip from ${bookFilePath}\nto ${OPEN_BOOK_DIR}`);
    return unzip(bookFilePath, OPEN_BOOK_DIR);
}

export async function getThumbnail(
    book: Book
): Promise<{ data: string; format: string } | undefined> {
    if (!book.thumbPath) return undefined;

    return {
        data: await FileSystem.readAsStringAsync(book.thumbPath, {
            encoding: "base64",
        }),
        format: extension(book.thumbPath),
    };
}

/**
 * Corresponds to BloomReader-RN's util/getFeaturesList.ts::getFeaturesList()
 * @remarks Moved to BookStorage to avoid require cycle from BookStorage.ts -> getFeaturesList.ts -> BookStorage.ts
 */
async function getFeaturesList(
    metaData: MetaData,
    tmpBookPath: string
): Promise<BookFeatures[]> {
    if (
        metaData.features &&
        metaData.bloomdVersion &&
        metaData.bloomdVersion >= 1
    )
        return metaData.features;

    const features = [];
    if (await hasAudio(tmpBookPath)) features.push(BookFeatures.talkingBook);
    // Note: in this case, more features may be added after BloomPlayer parses the HTML

    return features;
}

/**
 * Corresponds to BloomReader-RN's util/getFeaturesList.ts::hasAudio()
 * @remarks Moved to BookStorage to avoid require cycle from BookStorage.ts -> getFeaturesList.ts -> BookStorage.ts
 */
async function hasAudio(tmpBookPath: string): Promise<boolean> {
    const audioDirPath = `${tmpBookPath}/audio`;
    const audioDirExists = (await FileSystem.getInfoAsync(audioDirPath)).exists;
    const hasAudioFiles =
        audioDirExists &&
        (await FileSystem.readDirectoryAsync(audioDirPath)).length > 0;
    // review: do we need this somewhat expensive further check? I don't think Bloom publishes audio that isn't used.
    const html = await fetchHtml(tmpBookPath);
    const hasAudioSentences = html.includes("audio-sentence");
    return hasAudioFiles && hasAudioSentences;
}

// export async function moveBook(): Promise<string> {
//     const fileList = await RNFS.readDir(OPEN_BOOK_DIR);
//     const htmlFile = fileList.find(entry => /\.html?$/.test(entry.name));
//     if (!htmlFile || !htmlFile.path) {
//       return "";
//     }
//     await RNFS.moveFile(htmlFile.path, OPEN_BOOK_DIR + "/openBook.htm");
//     return htmlFile.path;
//   }

// TODO: BookRead has a somewhat similar function already. Combine them?
export async function fetchHtml(bookDir = OPEN_BOOK_DIR): Promise<string> {
    const fileList = await FileSystem.readDirectoryAsync(bookDir);
    const htmlFileName = fileList.find((entryName) =>
        /\.html?$/.test(entryName)
    );

    if (!htmlFileName) {
        return "";
    }
    const htmPath = Path.join(bookDir, encodeURIComponent(htmlFileName));
    return FileSystem.readAsStringAsync(htmPath);
}

//   export function deleteBooksAndShelves(items: BookOrShelf[]) {
//     items.forEach(item => {
//       rnfsSafeUnlink(item.filepath);
//       if (!isShelf(item) && item.thumbPath) rnfsSafeUnlink(item.thumbPath);
//     });
//   }

export function deleteBooksAndShelves(items: BookOrShelf[]) {
    items.forEach((item) => {
        FileSystem.deleteAsync(item.filepath);
        if (!isShelf(item) && item.thumbPath)
            FileSystem.deleteAsync(item.thumbPath);
    });
}

//   export function openBookFolderPath(): string {
//     return OPEN_BOOK_DIR;
//   }

async function extractBookToTmp(inPath: string): Promise<string> {
    let filename = nameFromPath(inPath);
    if (filename.includes("%")) {
        // react-native-zip-archive throws an error if bookFilePath is a valid percent-encoded URL.
        // It would be understandable to throw an error on invalid URL's that contain percent chucked into random places,
        // but these appear to be a valid URL, and Expo FileSystem doesn't crash on them
        //
        // To work around this, rename them to something without percent signs before passing them to react-native-zip-archive
        filename = "TEMP_BOOK";
        const intermediatePath = Path.join(
            FileSystem.cacheDirectory!,
            "temp.bloompub"
        );

        await FileSystem.copyAsync({
            from: inPath,
            to: intermediatePath,
        });

        inPath = intermediatePath;
    }

    const outPath = `${FileSystem.cacheDirectory}${filename}_FILES/`;
    await safeUnlink(outPath);
    return "file://" + (await unzip(inPath, outPath));
}

async function saveThumbnail(
    tmpBookPath: string,
    bookFilePath: string
): Promise<string | undefined> {
    const fileList = await FileSystem.readDirectoryAsync(tmpBookPath);
    const thumbFilename = fileList.find((filename) =>
        filename.startsWith("thumbnail.")
    );
    if (thumbFilename) {
        await ensureFolderAsync(THUMBS_DIR);
        const extension = thumbFilename.slice(thumbFilename.lastIndexOf("."));
        const inPath = tmpBookPath + "/" + thumbFilename;
        const outPath =
            THUMBS_DIR +
            "/" +
            nameifyPath(bookFilePath).replace(/\.\w+$/, extension);
        await FileSystem.moveAsync({
            from: inPath,
            to: outPath,
        });
        return outPath;
    }
}
