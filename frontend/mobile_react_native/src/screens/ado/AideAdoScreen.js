import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { HeroBand, NavTile } from '../../components/Shared';
import { useLangue } from '../../context/LanguageContext';

const FAQ_FR = [
  { q: 'Est-ce que mon identité est protégée ?', a: "Oui. Tu utilises un pseudo, aucune donnée personnelle n'est stockée." },
  { q: 'Qui peut voir mes messages ?', a: "Seul l'écoutant assigné et toi. Les supervisors ne voient les messages qu'en cas d'alerte." },
  { q: "Comment fonctionne l'analyse IA ?", a: "Le module IA détecte des signaux de détresse et crée une alerte pour un superviseur humain. Il ne génère jamais de messages." },
  { q: 'Puis-je supprimer mon compte ?', a: 'Oui, dans Paramètres > Sécurité > Supprimer mon compte.' },
];
const FAQ_EN = [
  { q: 'Is my identity protected?', a: 'Yes. You use a username and no personal data is stored.' },
  { q: 'Who can see my messages?', a: 'Only you and the assigned listener. Supervisors can access messages only when an alert requires it.' },
  { q: 'How does AI analysis work?', a: 'The AI module detects signs of distress and creates an alert for a human supervisor. It never writes messages.' },
  { q: 'Can I delete my account?', a: 'Yes, in Settings > Security > Delete my account.' },
];

export default function AideAdoScreen({ navigation }) {
  const { langue } = useLangue();
  const anglais = langue === 'en';
  const faq = anglais ? FAQ_EN : FAQ_FR;
  const t = anglais ? { back: '‹ Back', title: 'Help', subtitle: 'Frequently asked questions', urgent: 'Need help now?', urgentSub: 'Open emergency support', callError: 'Unable to start a phone call.' } : { back: '‹ Retour', title: 'Aide', subtitle: 'Questions fréquentes', urgent: "Besoin d'aide maintenant ?", urgentSub: "Ouvrir l'aide d'urgence", callError: "Impossible de lancer l'appel." };
  const ouvrirUrgence = async () => {
    try {
      await Linking.openURL('tel:119');
    } catch {
      alert(t.callError);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HeroBand titre={t.title} sousTitre={t.subtitle} />
        <View style={{ height: 12 }} />
        {faq.map((item, i) => (
          <View key={i} style={s.faqItem}>
            <Text style={s.faqQ}>{item.q}</Text>
            <Text style={s.faqA}>{item.a}</Text>
          </View>
        ))}
        <View style={{ height: 12 }} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>📞</Text>} label={t.urgent} sub={t.urgentSub}
          accent={colors.coral} onPress={ouvrirUrgence} />
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
