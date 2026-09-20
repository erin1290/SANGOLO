import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { useLangue } from '../context/LanguageContext';

/** Menu déroulant local, sans boîte de dialogue et avec choix mémorisé. */
export default function LanguagePicker({ light = false }) {
  const { langue, changerLangue } = useLangue();
  const [ouvert, setOuvert] = useState(false);
  const choisir = async (valeur) => {
    await changerLangue(valeur);
    setOuvert(false);
  };

  return <View style={s.zone}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choisir la langue" style={[s.bouton, light && s.boutonClair]} onPress={() => setOuvert((v) => !v)}>
      <Text style={[s.boutonTexte, light && s.boutonTexteClair]}>{langue === 'en' ? '🇬🇧  English' : '🇫🇷  Français'}  {ouvert ? '⌃' : '⌄'}</Text>
    </TouchableOpacity>
    {ouvert && <View style={s.menu}>
      <TouchableOpacity style={[s.option, langue === 'fr' && s.optionActive]} onPress={() => choisir('fr')}><Text style={s.optionTexte}>🇫🇷  Français</Text><Text style={s.check}>{langue === 'fr' ? '✓' : ''}</Text></TouchableOpacity>
      <TouchableOpacity style={[s.option, langue === 'en' && s.optionActive]} onPress={() => choisir('en')}><Text style={s.optionTexte}>🇬🇧  English</Text><Text style={s.check}>{langue === 'en' ? '✓' : ''}</Text></TouchableOpacity>
    </View>}
  </View>;
}

const s = StyleSheet.create({
  zone: { position: 'relative', zIndex: 50, elevation: 50, minWidth: 150 },
  bouton: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  boutonClair: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, boutonTexte: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 }, boutonTexteClair: { color: colors.ink },
  menu: { position: 'absolute', top: 48, right: 0, width: 185, backgroundColor: '#fff', borderRadius: 14, padding: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 12 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 }, optionActive: { backgroundColor: '#E7F4EA' },
  optionTexte: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink }, check: { color: colors.green, fontFamily: fonts.bodyBold, fontSize: 17 },
});
