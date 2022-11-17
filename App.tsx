import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BookReader } from './src/BookReader';
import Constants from 'expo-constants';

export default function App() {
    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <BookReader />
            <StatusBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeAreaContainer: {
        height: "100%",
        paddingTop: Constants.statusBarHeight
    },
});
