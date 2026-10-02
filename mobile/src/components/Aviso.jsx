// Aviso rápido no rodapé (equivalente ao .aviso do web), disponível em qualquer tela
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cor, fonte } from '../lib/tema.js';

const AvisoContext = createContext(() => {});

export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState('');
  const insets = useSafeAreaInsets();
  const avisar = useCallback((msg) => setAviso(msg), []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <AvisoContext.Provider value={avisar}>
      {children}
      {aviso ? (
        <View pointerEvents="none" style={[s.caixa, { bottom: insets.bottom + 84 }]}>
          <Text style={s.texto} accessibilityLiveRegion="polite">{aviso}</Text>
        </View>
      ) : null}
    </AvisoContext.Provider>
  );
}

export const useAviso = () => useContext(AvisoContext);

const s = StyleSheet.create({
  caixa: {
    position: 'absolute', left: 16, right: 16, alignItems: 'center',
  },
  texto: {
    backgroundColor: cor.texto, color: cor.fundo, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12,
    fontFamily: fonte.textoForte, fontSize: 14, overflow: 'hidden', textAlign: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
});
