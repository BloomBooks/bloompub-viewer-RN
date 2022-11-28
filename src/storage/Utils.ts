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
