import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Home: undefined;
    Read: { bookUrl: string };
}

export type ReaderScreenProps = NativeStackScreenProps<RootStackParamList, 'Read', 'PUBViewer'>
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home', 'PUBViewer'>
