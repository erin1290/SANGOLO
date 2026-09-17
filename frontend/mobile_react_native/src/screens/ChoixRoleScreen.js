import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/colors';
import { NavTile } from '../components/Shared';

export default function ChoixRoleScreen({ navigation }) {
  return (
    <View style={s.container}>
      <Image source={require('../../assets/logo_sangolo.png')} style={s.logo} resizeMode="contain" />
      <Text style={s.title}>Qui es-tu ?</Text>
      <Text style={s.sub}>Choisis ton espace pour continuer</Text>
      <View style={s.cards}>
        <NavTile
          icon={<Text style={s.icon}>👦</Text>}
          label="Ado"
          sub="Espace d'écoute confidentiel"
          accent={colors.coral}
          onPress={() => navigation.navigate('Welcome')}
        />
        <NavTile
          icon={<Text style={s.icon}>🎧</Text>}
          label="Écoutant"
          sub="Bénévole partenaire"
          accent={colors.green}
          onPress={() => navigation.navigate('EcoutantWelcome')}
        />
        <NavTile
          icon={<Text style={s.icon}>🛡️</Text>}
          label="Superviseur"
          sub="Équipe de supervision"
          accent={colors.inkSurface}
          onPress={() => navigation.navigate('SuperviseurConnexion')}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 200, height: 200, marginBottom: 20 },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 6, marginBottom: 32, textAlign: 'center' },
  cards: { width: '100%' },
  icon: { fontSize: 20 },
});