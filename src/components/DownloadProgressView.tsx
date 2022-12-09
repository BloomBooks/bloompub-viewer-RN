import * as React from "react";
import { FunctionComponent } from "react";
import { Text, View } from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";
import {
    Button as PaperButton,
    Portal,
    ProgressBar,
    useTheme,
} from "react-native-paper";
//import { Props as ProgressBarProps } from "react-native-paper/lib/typescript/components/ProgressBar";
import { Spacing } from "../constants/Spacing";

interface Action {
    label: string;
    onPress: () => void;
}
interface DownloadProgressViewProps {
    visible?: boolean | undefined;
    message?: string | undefined;
    progress: number; // The progress to pass to react-native-paper's ProgressBar. Should be between 0 and 1.
    loadingAction: Action | undefined;
    doneAction: Action | undefined;
}

export const DownloadProgressView: FunctionComponent<
    DownloadProgressViewProps
> = ({ visible, message, progress, loadingAction, doneAction }) => {
    const [progressState, setProgressState] = React.useState(progress);
    const [isDone, setIsDone] = React.useState(false);
    React.useEffect(() => {
        setProgressState(progress);

        setIsDone(progress >= 1.0);
    }, [progress]);

    const theme = useTheme();

    return (
        <>
            {visible && (
                <Portal>
                    <View
                        style={[
                            styles.positionBottom,
                            styles.container,
                            { backgroundColor: theme.colors.onBackground },
                        ]}
                    >
                        <View style={styles.row}>
                            <Text style={styles.messageRow}>{message}</Text>
                        </View>
                        <View style={[styles.row, styles.progressAndActionRow]}>
                            <View style={styles.progressBar}>
                                <ProgressBar
                                    progress={progressState}
                                    color={theme.colors.tertiary}
                                    visible={!isDone}
                                />
                            </View>
                            <View style={styles.actionButton}>
                                <PaperButton
                                    textColor={theme.colors.tertiary} // or maybe it should be 'link' color on iOS?
                                    uppercase={true}
                                    onPress={
                                        isDone
                                            ? doneAction?.onPress
                                            : loadingAction?.onPress
                                    }
                                >
                                    {isDone
                                        ? doneAction?.label
                                        : loadingAction?.label}
                                </PaperButton>
                            </View>
                        </View>
                    </View>
                </Portal>
            )}
        </>
    );
};

const styles = EStyleSheet.create({
    positionBottom: {
        position: "absolute",
        bottom: 0,
    },
    container: {
        paddingHorizontal: Spacing.Medium,
        width: "100%",

        flexDirection: "column", // Make each child a new row
    },
    row: {
        flex: 1,
        alignItems: "baseline", // First row should start flush with the left edge
        justifyContent: "center", // Center items vertically

        minHeight: "2.5rem",
    },
    messageRow: {
        color: "white",
    },
    progressAndActionRow: {
        flexDirection: "row", // align children on the same row
        alignItems: "center", // center vertically
    },
    progressBar: {
        flex: 1,
        flexGrow: 1, // Fill up the remaining space not needed by actionButton
    },
    actionButton: {
        flex: 0, // Size this button according to how much width/height it needs to fit.
    },
});
