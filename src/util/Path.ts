/**
 * Simulates the API of C#'s System.IO.Path
 */
export class Path {
    /**
     * Changes the extension of a path string.
     */
    public static changeExtension(
        path: string,
        extension?: string | null | undefined
    ): string;
    public static changeExtension(
        path: string | null | undefined,
        extension?: string | null | undefined
    ): string | null | undefined;
    public static changeExtension(
        path: string | null | undefined,
        extension?: string | null | undefined
    ) {
        if (!path) {
            return path;
        }

        const extensionStartIndex = path.lastIndexOf(".");
        if (extension === null || extension === undefined) {
            // Extension is generally supposed to be removed in this case.

            if (extensionStartIndex < 0) {
                // Well, except for this corner case. I guess we just return path unmodified?
                return path;
            }

            // Remove extension
            return path.substring(0, extensionStartIndex);
        }

        const extensionWithDot = extension.startsWith(".")
            ? extension
            : `.${extension}`;

        if (extensionStartIndex < 0) {
            // Extension supposed to be appended to path
            return path + extensionWithDot;
        }

        // Normal case: Change extension
        const pathWithoutExtension = path.substring(0, extensionStartIndex);
        return pathWithoutExtension + extensionWithDot;
    }

    /**
     * Returns the file name and extension of the specified path string.
     */
    public static getFileName(path: string) {
        const index = path.lastIndexOf("/");
        return path.substring(index + 1); // returns "" if past end of string
    }

    /**
     * Concatenates an array of paths into a single path.
     */
    public static join(...paths: string[]) {
        if (paths.length === 0) {
            return "";
        }

        const ensureEndsWithDirectorySeparator = (path: string) =>
            path.endsWith("/") ? path : path + "/";

        return paths
            .map((path, index) => {
                if (index < paths.length - 1) {
                    // not the last element
                    return ensureEndsWithDirectorySeparator(path);
                } else {
                    // this is the last element
                    return path;
                }
            })
            .join("");
    }
}
