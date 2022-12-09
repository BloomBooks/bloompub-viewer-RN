import * as FileSystem from "expo-file-system";
import { Path } from "../util/Path";

export const BLOOM_PLAYER_FOLDER = FileSystem.cacheDirectory + "bloomPlayer";

export class Locations {
    public static BooksFolder = Path.join(
        FileSystem.documentDirectory!, // never null on Android or iOS, but returns null if on web.
        "Books"
    );
}
