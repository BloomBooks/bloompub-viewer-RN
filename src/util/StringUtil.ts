/**
 * Circular replacer intended for use with JSON.stringify.
 * This should prevent the exceptions that JSON.stringify generates on circular references.
 */
const getStringifyReplacer = () => {
    const seen = new WeakSet();
    return (key: any, value: object | null) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};
