import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { BookReader } from './src/BookReader';
import { StartScreen } from './src/StartScreen';

const App = () => {
    const desiredScreen: 'start' | 'read' = 'start';
    return (
        desiredScreen === 'start' ?
            <View style={styles.container}>
                <StartScreen />
                <StatusBar style="auto" />
            </View>
            :
            <BookReader bookUrl='https%3A%2F%2Fs3.amazonaws.com%2Fbloomharvest-sandbox%2Fcolin_suggett%2540sil.org%252f885ba15f-97a7-4c83-ba3c-ae263607d9e6%2Fbloomdigital%252findex.htm' />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
});

export default App;
