import * as BookStorage from "../storage/BookStorage";
// import RNFS from "react-native-fs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ErrorLog from "./ErrorLog";
import * as BRAnalytics from "./BRAnalytics";
import {
    COLLECTION_FORMAT_VERSION,
    updateBookListFormatIfNeeded,
} from "../models/BookCollection";
import { importSampleBooks } from "../storage/SampleBooks";

const APP_VERSION = require("../../package.json").version;
const LAST_RUN_VERSION_KEY = "bloomreader.lastRunVersion";
const COLLECTION_FORMAT_VERSION_KEY = "bloomreader.bookItemVersion";

export default async function startupTasks(): Promise<void> {
    // Note: You can reset the AsyncStorage by manually calling this: await AsyncStorage.clear()
    await BookStorage.createDirectories();
    await BRAnalytics.setup();
    cacheCleanup();

    const lastRunVersion = await getLastRunVersion();
    let shouldRunStartupTasks = false;
    if (lastRunVersion !== APP_VERSION) {
        console.info("StartupTasks: newAppVersion detected.");
        shouldRunStartupTasks = true;
    } else if (APP_VERSION.startsWith("0.")) {
        console.info(
            "StartupTasks: running every time because on major version 0."
        );
        shouldRunStartupTasks = true;
    }
    if (shouldRunStartupTasks) {
        ErrorLog.logNewAppVersion(APP_VERSION);
        if (lastRunVersion !== null) {
            if (!APP_VERSION.startsWith("0.")) {
                BRAnalytics.reportInstallationSource();
            }
            await updateBookListFormatIfNeeded(
                await getExistingCollectionFormatVersion()
            );
        }
        await importSampleBooks();
    }

    setVersions();
}

// When we share temporary files, we can't clean them up immediately
// because the receiving app needs them. 1 day should be long enough
async function cacheCleanup(): Promise<void> {
    return;

    // TODO: Implement me
    //   const dirNames = ["apk", "bundles"];
    //   for (let i = 0; i < dirNames.length; ++i) {
    //     const path = `${RNFS.CachesDirectoryPath}/${dirNames[i]}`;
    //     if (await RNFS.exists(path)) {
    //       const stat = await RNFS.stat(path);
    //       const fileMS = stat.mtime.valueOf();
    //       if (Date.now().valueOf() > fileMS + 1000 * 60 * 60 * 24)
    //         RNFS.unlink(path);
    //     }
    //   }
}

async function getLastRunVersion(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_RUN_VERSION_KEY);
}

async function getExistingCollectionFormatVersion(): Promise<string | null> {
    return AsyncStorage.getItem(COLLECTION_FORMAT_VERSION_KEY);
}

async function setVersions(): Promise<void> {
    AsyncStorage.multiSet([
        [LAST_RUN_VERSION_KEY, APP_VERSION],
        // [COLLECTION_FORMAT_VERSION, COLLECTION_FORMAT_VERSION], // This is the old code, but I don't think it's right. It sets it to the literal string "bloomreader.bookItemVersion"
        [COLLECTION_FORMAT_VERSION_KEY, COLLECTION_FORMAT_VERSION],
    ]);
}
