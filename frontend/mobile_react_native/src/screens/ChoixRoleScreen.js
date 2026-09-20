import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { NavTile } from '../components/Shared';
import LanguagePicker from '../components/LanguagePicker';
import { useLangue } from '../context/LanguageContext';

export default function ChoixRoleScreen({ navigation }) {
  const { langue } = useLangue();
  const t = langue === 'en' ? {
    title: 'Who are you?', sub: 'Choose your space to continue',
    ado: 'Teen', adoSub: 'Confidential listening space',
    ecoutant: 'Listener', ecoutantSub: 'Partner volunteer',
    superviseur: 'Supervisor', superviseurSub: 'Supervision team',
  } : {
    title: 'Qui es-tu ?', sub: 'Choisis ton espace pour continuer',
    ado: 'Ado', adoSub: "Espace d'écoute confidentiel",
    ecoutant: 'Écoutant', ecoutantSub: 'Bénévole partenaire',
    superviseur: 'Superviseur', superviseurSub: 'Équipe de supervision',
  };
  return (
    <View style={s.container}>
      <View style={s.langue}><LanguagePicker /></View>
      <Image source={require('../../assets/logo_sangolo.png')} style={s.logo} resizeMode="contain" />
      <Text style={s.title}>{t.title}</Text>
      <Text style={s.sub}>{t.sub}</Text>
      <View style={s.cards}>
        <NavTile
          icon={<Text style={s.icon}>👦</Text>}
          label={t.ado}
          sub={t.adoSub}
          accent={colors.coral}
          onPress={() => navigation.navigate('Welcome')}
        />
        <NavTile
          icon={<Text style={s.icon}>🎧</Text>}
          label={t.ecoutant}
          sub={t.ecoutantSub}
          accent={colors.green}
          onPress={() => navigation.navigate('EcoutantWelcome')}
        />
        <NavTile
          icon={<Text style={s.icon}>🛡️</Text>}
          label={t.superviseur}
          sub={t.superviseurSub}
          accent={colors.inkSurface}
          onPress={() => navigation.navigate('SuperviseurConnexion')}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  langue: { position: 'absolute', right: 20, top: 54 },
  logo: { width: 200, height: 200, marginBottom: 20 },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 6, marginBottom: 32, textAlign: 'center' },
  cards: { width: '100%' },
  icon: { fontSize: 20 },
});
