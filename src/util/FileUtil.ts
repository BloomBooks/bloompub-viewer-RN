import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import SingletonPromise from "./SingletonPromise";

export function nameFromPath(path: string): string {
    return path.slice(path.lastIndexOf("/") + 1);
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
            logMessage: `[safeUnlink] Error deleting file: ${path}\n${JSON.stringify(
                err
            )}`,
        });
    }
}

// PermissionsAndroid module can't handle overlapping requests
// and that would be annoying for the user, so we use a SingletonPromise
// to give the same answer to all requests
const singletonPromise = new SingletonPromise<string>(requestStoragePermission);

export async function readExternalBloomDir(): Promise<string> {
    return singletonPromise.getPromise();
}

// Using the external storage (including the traditional Bloom folder)
// requires user permission at runtime.
// This method checks for permission (requesting it if necessary) and
// if permission is granted, returns the path to the folder
// otherwise it throws "External Storage Permission Refused"
async function requestStoragePermission(): Promise<string> {
    throw "External Storage Permission Not Implemented";

    // TODO: Look into me
    // const permissions = [
    //   PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    // ];
    // const result = await PermissionsAndroid.requestMultiple(permissions);
    // if (result[permissions[0]] == PermissionsAndroid.RESULTS.GRANTED) {
    //   return externalBloomDirPath;
    // } else {
    //   throw "External Storage Permission Refused";
    // }
}

export function isBookFile(filePath: string): boolean {
    const toLower = filePath.toLowerCase();
    return toLower.endsWith(".bloomd") || toLower.endsWith(".bloompub");
}

export function isShelfFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith(".bloomshelf");
}

// Turns a filepath into something that can be used as a filename
export function nameifyPath(filepath: string): string {
    // REVIEW: Hmm... would calling encodeURIComponent work instead? [JS]
    return filepath.replace(/[/:]/g, "--");
}

export function extension(filepath: string): string {
    return filepath.slice(filepath.lastIndexOf(".") + 1).toLocaleLowerCase();
}

export async function readAssetContentsAsync(
    asset: Asset
): Promise<string | null> {
    await asset.downloadAsync();

    if (!asset.localUri) {
        return null;
    }
    return FileSystem.readAsStringAsync(asset.localUri);
}

export async function copyAssetAsync(options: { asset: Asset; to: string }) {
    const { asset, to } = options;

    if (encodeURI(asset.name) !== asset.name) {
        // Surprisingly, expo-asset doesn't seem to encode special characters in the asset name
        // when generating the asset's URI.
        // Notably, asset names with space on iOS will break :( :( :(
        //
        // The URI will look something like: http://192.168.1.42:8081/assets/assets/books/${asset.name}.{asset.type}?[some expo-generated params]
        // asset.name should theoretically be encoded according to encodeURI, but I saw it in unencoded form.
        // Although in JS-land we can try to manually fix asset.uri (surprisingly), that still doesn't fix the end result
        // because it just downloads an "Asset not found" result.
        // I'd guess that's because the encoded URI is not properly decoded by Expo,
        // which would be unsurprising since it fails to encode it.
        // So, seems like there's nothing I can think of to fix this,
        // other than to not include assets that have spaces in their filename.
        console.warn(
            `Asset name contains special characters. Downloading the asset may not work.\nDecoded: ${
                asset.name
            }\nEncoded: ${encodeURI(asset.name)}`
        );
    }
    await asset.downloadAsync();

    if (!asset.localUri) {
        throw new Error("Asset localUri expected, but was null or empty.");
    }

    return FileSystem.copyAsync({
        from: asset.localUri,
        to,
    });
}

export async function ensureFolderAsync(folderPath: string) {
    return FileSystem.makeDirectoryAsync(folderPath, {
        intermediates: true,
    });
}
