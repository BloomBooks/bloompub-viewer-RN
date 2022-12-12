import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

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
