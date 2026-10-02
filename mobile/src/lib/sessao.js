// O token fica no armazenamento seguro do aparelho (Keychain / Keystore).
// No navegador (expo start --web) o SecureStore não existe, então usa o localStorage.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHAVE = 'createit_token';
const web = Platform.OS === 'web';

export const lerToken = () => (web ? Promise.resolve(localStorage.getItem(CHAVE)) : SecureStore.getItemAsync(CHAVE));

export const salvarToken = (token) => (web ? Promise.resolve(localStorage.setItem(CHAVE, token)) : SecureStore.setItemAsync(CHAVE, token));

export const apagarToken = () => (web ? Promise.resolve(localStorage.removeItem(CHAVE)) : SecureStore.deleteItemAsync(CHAVE));
