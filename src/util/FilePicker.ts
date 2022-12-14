import * as DocumentPicker from "expo-document-picker";

const validFileTypes = [".bloompub", ".bloomd"]; // Bloom Library currently has both

export const pickBloomPubAsync = async () => {
    const options = {
        // This is what .bloompubs report as, since they are essentially .zip files.
        // Unfortunately, this doesn't seem to do anything.
        type: "application/octet-stream",
        copyToCacheDirectory: true,
    };

    const pickerResult = await DocumentPicker.getDocumentAsync(options);
    if (pickerResult.type === "success") {
        const lcFilename = pickerResult.name.toLowerCase();
        const lastDotIndex = lcFilename.lastIndexOf(".");
        if (lastDotIndex < 1) {
            // shouldn't happen!
            return null;
        }
        const extension = lcFilename.substring(lastDotIndex);
        console.log("file extension: " + extension);
        if (!validFileTypes.includes(extension)) {
            alert("Please choose a .bloompub file");
            return null;
        }
        const chosenBookUri = pickerResult.uri;
        console.log("Reading... " + chosenBookUri);
        console.log("Filename=" + pickerResult.name);
        return chosenBookUri;
    } else {
        console.info("canceled");
        return null;
    }
};
