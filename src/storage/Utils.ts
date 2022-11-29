import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

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
