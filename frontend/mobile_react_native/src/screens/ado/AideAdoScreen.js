import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, NavTile } from '../../components/Shared';

const FAQ = [
  { q: 'Est-ce que mon identité est protégée ?', a: "Oui. Tu utilises un pseudo, aucune donnée personnelle n'est stockée." },
  { q: 'Qui peut voir mes messages ?', a: "Seul l'écoutant assigné et toi. Les supervisors ne voient les messages qu'en cas d'alerte." },
  { q: "Comment fonctionne l'analyse IA ?", a: "Le module IA détecte des signaux de détresse et crée une alerte pour un superviseur humain. Il ne génère jamais de messages." },
  { q: 'Puis-je supprimer mon compte ?', a: 'Oui, dans Paramètres > Sécurité > Supprimer mon compte.' },
];

export default function AideAdoScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HeroBand titre="Aide" sousTitre="Questions fréquentes" />
        <View style={{ height: 12 }} />
        {FAQ.map((item, i) => (
          <View key={i} style={s.faqItem}>
            <Text style={s.faqQ}>{item.q}</Text>
            <Text style={s.faqA}>{item.a}</Text>
          </View>
        ))}
        <View style={{ height: 12 }} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>📞</Text>} label="Besoin d'aide maintenant ?" sub="Appele une ligne d'écoute"
          accent={colors.coral} onPress={() => Linking.openURL('tel:800')} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  faqItem: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  faqQ: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink, marginBottom: 6 },
  faqA: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 18 },
});