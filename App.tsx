import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BookReader } from './src/BookReader';
import Constants from 'expo-constants';
import { StartScreen } from './src/StartScreen';

const App = () => {
    return (
        <View style={styles.container}>
            <StartScreen />
            <StatusBar style="auto" />
        </View>
        <SafeAreaView style={styles.safeAreaContainer}>
            <BookReader />
            <StatusBar />
        </SafeAreaView>
    );
}

export default App;

const styles = StyleSheet.create({
    safeAreaContainer: {
        height: "100%",
        paddingTop: Constants.statusBarHeight
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
});
