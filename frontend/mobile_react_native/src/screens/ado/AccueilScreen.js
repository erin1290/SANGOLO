import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/colors';
import { NavTile, PrimaryButton } from '../../components/Shared';
import LanguagePicker from '../../components/LanguagePicker';
import { useLangue } from '../../context/LanguageContext';

const HUMEURS = ['🙂', '😐', '😢', '😠', '😴'];

const TRADUCTIONS = {
  fr: {
    bonsoir: 'Bonsoir 👋',
    content: 'On est content de te voir',
    humeur: 'Comment tu te sens là, maintenant ?',
    journal: 'Mon journal',
    journalSub: 'Texte, audio ou photo',
    discussions: 'Mes discussions',
    discussionsSub: 'Reprends où tu t\'es arrêté',
    parler: 'Parler à un écoutant',
    parlerSub: 'Choisis un écoutant en ligne',
    cercles: 'Mes cercles d\'écoute',
    cerclesSub: 'Tu n\'es pas seul(e)',
    peer: 'Parler à un pair',
    peerSub: 'Discute avec les membres de ton cercle',
    profil: 'Mon profil',
    profilSub: 'Paramètres et sécurité',
    aide: 'J\'ai besoin d\'aide maintenant',
  },
  en: {
    bonsoir: 'Good evening 👋',
    content: 'We\'re happy to see you',
    humeur: 'How are you feeling right now?',
    journal: 'My journal',
    journalSub: 'Text, audio or photo',
    discussions: 'My discussions',
    discussionsSub: 'Pick up where you left off',
    parler: 'Talk to a listener',
    parlerSub: 'Choose an online listener',
    cercles: 'My listening circles',
    cerclesSub: 'You\'re not alone',
    peer: 'Talk to a peer',
    peerSub: 'Chat with your circle members',
    profil: 'My profile',
    profilSub: 'Settings and security',
    aide: 'I need help now',
  },
};

export default function AccueilScreen({ navigation }) {
  const [humeur, setHumeur] = useState(0);
  const { langue } = useLangue();
  const t = TRADUCTIONS[langue] || TRADUCTIONS.fr;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={s.statusBar} />
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>{t.bonsoir}</Text>
          <Text style={s.subGreeting}>{t.content}</Text>
        </View>
        <LanguagePicker />
        <View style={s.avatar} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.moodCard}>
          <Text style={s.moodQuestion}>{t.humeur}</Text>
          <View style={s.moodRow}>
            {HUMEURS.map((emoji, i) => (
              <TouchableOpacity key={i} onPress={() => setHumeur(i)}
                style={[s.moodStop, i === humeur && s.moodStopActive]}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <NavTile icon={<Text style={{ fontSize: 18 }}>📓</Text>} label={t.journal} sub={t.journalSub}
          accent={colors.amber} onPress={() => navigation.navigate('Journal')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>💬</Text>} label={t.discussions} sub={t.discussionsSub}
          accent={colors.green} onPress={() => navigation.navigate('MesDiscussions')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>🎧</Text>} label={t.parler} sub={t.parlerSub}
          accent={colors.inkSurface} onPress={() => navigation.navigate('ListeEcoutants')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>👥</Text>} label={t.cercles} sub={t.cerclesSub}
          accent={colors.coral} onPress={() => navigation.navigate('CerclesEcoute')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>🤝</Text>} label={t.peer} sub={t.peerSub}
          accent={colors.inkSurface} onPress={() => navigation.navigate('AdoPeer')} />
        <NavTile icon={<Text style={{ fontSize: 18 }}>👤</Text>} label={t.profil} sub={t.profilSub}
          accent={colors.ink} onPress={() => navigation.navigate('Profil')} />
      </ScrollView>

      <View style={s.sosFab}>
        <PrimaryButton label={t.aide} onPress={() => navigation.navigate('Sos')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  statusBar: { height: 44, backgroundColor: colors.inkSurface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.inkSurface, paddingHorizontal: 20, paddingBottom: 18,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  greeting: { fontFamily: fonts.displayBold, fontSize: 22, color: '#fff' },
  subGreeting: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  langueBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 12 },
  langueText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  scrollContent: { padding: 16, paddingBottom: 90 },
  moodCard: {
    backgroundColor: colors.card, marginBottom: 12, borderRadius: 18, padding: 16,
    shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  moodQuestion: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginBottom: 10 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodStop: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  moodStopActive: { backgroundColor: colors.amber },
  sosFab: { position: 'absolute', left: 16, right: 16, bottom: 16 },
});
