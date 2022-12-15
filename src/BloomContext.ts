/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { BookCollection, emptyBookCollection } from "./models/BookCollection";

export const BloomContext = React.createContext<{
    drawerLockMode: "unlocked" | "locked-closed";
    setDrawerLockMode: (lockMode: "unlocked" | "locked-closed") => void;
    bookCollection: BookCollection;
    setBookCollection: (bc: BookCollection) => void;
}>({
    drawerLockMode: "unlocked",
    setDrawerLockMode: () => {},
    bookCollection: emptyBookCollection(),
    setBookCollection: () => {},
});
